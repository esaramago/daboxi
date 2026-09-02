#!/usr/bin/env node

/**
 * Migration Script: Associate transactions with a specific user (daboxi@emanuelsaramago.com)
 * 
 * Usage:
 *   node scripts/migrate-transactions-to-user.mjs
 *   node scripts/migrate-transactions-to-user.mjs --email daboxi@emanuelsaramago.com --password <password>
 *   node scripts/migrate-transactions-to-user.mjs --session <sessionToken>
 *   node scripts/migrate-transactions-to-user.mjs --apiKey <apiKey> --userId <userId>
 *   node scripts/migrate-transactions-to-user.mjs --delay 100
 */

import { Client, TablesDB, Account, Query, Permission, Role } from 'appwrite'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

// Load .env file manually if exists
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const [key, ...values] = trimmed.split('=')
      if (key && values.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = values.join('=').trim()
      }
    }
  }
}

loadEnv()

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    email: process.env.MIGRATION_USER_EMAIL || 'daboxi@emanuelsaramago.com',
    password: process.env.MIGRATION_USER_PASSWORD || '',
    session: process.env.MIGRATION_SESSION_TOKEN || '',
    apiKey: process.env.APPWRITE_API_KEY || '',
    userId: process.env.MIGRATION_USER_ID || '',
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://appwrite.emanuelsaramago.com/v1',
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '693346e6003456a9a668',
    databaseId: process.env.APPWRITE_DATABASE_ID || '693347b20038c67958ec',
    batchSize: 100,
    delay: 100, // ms delay between updates to prevent rate limiting
    help: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--email' && args[i + 1]) options.email = args[++i]
    if (arg === '--password' && args[i + 1]) options.password = args[++i]
    if (arg === '--session' && args[i + 1]) options.session = args[++i]
    if (arg === '--apiKey' && args[i + 1]) options.apiKey = args[++i]
    if (arg === '--userId' && args[i + 1]) options.userId = args[++i]
    if (arg === '--endpoint' && args[i + 1]) options.endpoint = args[++i]
    if (arg === '--project' && args[i + 1]) options.projectId = args[++i]
    if (arg === '--database' && args[i + 1]) options.databaseId = args[++i]
    if (arg === '--batchSize' && args[i + 1]) options.batchSize = parseInt(args[++i], 10)
    if (arg === '--delay' && args[i + 1]) options.delay = parseInt(args[++i], 10)
    if (arg === '--help' || arg === '-h') options.help = true
  }

  return options
}

function showHelp() {
  console.log(`
Daboxi - Script de Migração de Transações para Utilizador

Opções:
  --email <email>       Email do utilizador alvo (default: daboxi@emanuelsaramago.com)
  --password <password> Palavra-passe do utilizador (se omitida, será solicitada interativamente)
  --session <token>     Token de sessão ativa do Appwrite
  --apiKey <key>        Chave de API do servidor Appwrite
  --userId <id>         ID do utilizador (opcional se autenticado por email ou session)
  --endpoint <url>      Endpoint do Appwrite (default: de .env)
  --project <id>        Project ID do Appwrite (default: de .env)
  --database <id>       Database ID do Appwrite (default: de .env)
  --batchSize <num>     Tamanho do lote para migração (default: 100)
  --delay <ms>          Pausa em ms entre cada atualização (default: 100ms)
  --help, -h            Exibe esta mensagem de ajuda
`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function promptPassword(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(promptText, (ans) => {
      rl.close()
      resolve(ans.trim())
    })
  })
}

/**
 * Realiza o login na API Appwrite e extrai o session secret dos cookies ou JSON.
 */
async function loginAppwrite(endpoint, projectId, email, password) {
  const response = await fetch(`${endpoint}/account/sessions/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || JSON.stringify(data))
  }

  let sessionSecret = data.secret

  if (!sessionSecret) {
    let cookieHeaders = []
    if (typeof response.headers.getSetCookie === 'function') {
      cookieHeaders = response.headers.getSetCookie()
    } else {
      const single = response.headers.get('set-cookie')
      if (single) cookieHeaders = [single]
    }

    const sessionCookieName = `a_session_${projectId}`
    for (const header of cookieHeaders) {
      const match = header.match(new RegExp(`(?:${sessionCookieName}|a_session_[^=]+|a_session)=([^;]+)`))
      if (match && match[1]) {
        sessionSecret = match[1]
        break
      }
    }
  }

  if (!sessionSecret && data.$id) {
    sessionSecret = data.secret || data.$id
  }

  return {
    sessionSecret,
    userId: data.userId,
    session: data,
  }
}

function applySessionToClient(client, projectId, sessionSecret) {
  client.setSession(sessionSecret)
  client.headers['X-Fallback-Cookies'] = JSON.stringify({
    [`a_session_${projectId}`]: sessionSecret,
    [`a_session_${projectId}_legacy`]: sessionSecret,
  })
  client.headers['Cookie'] = `a_session_${projectId}=${sessionSecret}; a_session=${sessionSecret}; a_session_${projectId}_legacy=${sessionSecret}`
}

/**
 * Normaliza os dados do documento para evitar erros de validação de relacionamento many-to-one
 */
function sanitizeTransactionData(row) {
  const data = {}

  if ('subCategory' in row) {
    if (Array.isArray(row.subCategory)) {
      if (row.subCategory.length === 0) {
        data.subCategory = null
      } else {
        const first = row.subCategory[0]
        data.subCategory = (typeof first === 'object' && first !== null) ? (first.$id || null) : (first || null)
      }
    } else if (typeof row.subCategory === 'object' && row.subCategory !== null) {
      data.subCategory = row.subCategory.$id || null
    } else if (typeof row.subCategory === 'string') {
      data.subCategory = row.subCategory
    } else if (row.subCategory === null) {
      data.subCategory = null
    }
  }

  return data
}

/**
 * Executa uma operação com retry e backoff caso atinja o rate limit
 */
async function executeWithRetry(operationFn, maxRetries = 6) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operationFn()
    } catch (err) {
      const isRateLimit =
        err.code === 429 ||
        (err.message && err.message.toLowerCase().includes('rate limit')) ||
        (err.response && String(err.response).toLowerCase().includes('rate limit'))

      if (isRateLimit && attempt < maxRetries) {
        const waitMs = Math.min(attempt * 3000, 15000) // 3s, 6s, 9s, 12s, 15s
        console.warn(`  [Rate Limit] Limite atingido. Aguardando ${waitMs / 1000}s antes da tentativa ${attempt + 1}/${maxRetries}...`)
        await sleep(waitMs)
        continue
      }
      throw err
    }
  }
}

async function main() {
  const options = parseArgs()

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  console.log('='.repeat(60))
  console.log(' Daboxi - Migração de Transações para Utilizador')
  console.log('='.repeat(60))
  console.log(`Endpoint:   ${options.endpoint}`)
  console.log(`Project ID: ${options.projectId}`)
  console.log(`Database:   ${options.databaseId}`)
  console.log(`Target:     ${options.email}`)
  console.log(`Delay:      ${options.delay}ms entre atualizações`)
  console.log('='.repeat(60))

  const client = new Client()
    .setEndpoint(options.endpoint)
    .setProject(options.projectId)

  let targetUserId = options.userId

  if (options.apiKey) {
    client.setKey(options.apiKey)
    if (!targetUserId) {
      console.log(`[Auth] Procurando utilizador por email: ${options.email}...`)
      const res = await fetch(`${options.endpoint}/users?queries[]=${encodeURIComponent(`equal("email", ["${options.email}"])`)}`, {
        headers: {
          'X-Appwrite-Project': options.projectId,
          'X-Appwrite-Key': options.apiKey,
        },
      })
      const data = await res.json()
      if (!data.users || data.users.length === 0) {
        console.error(`[Error] Utilizador com email ${options.email} não foi encontrado.`)
        process.exit(1)
      }
      targetUserId = data.users[0].$id
    }
  } else if (options.session) {
    applySessionToClient(client, options.projectId, options.session)
    const account = new Account(client)
    try {
      const user = await account.get()
      targetUserId = user.$id
      console.log(`[Auth] Autenticado com sessão com sucesso: ${user.email} (ID: ${user.$id})`)
    } catch {
      if (!targetUserId) {
        console.error('[Error] Falha ao obter dados da conta a partir da sessão fornecida.')
        process.exit(1)
      }
    }
  } else {
    let password = options.password
    if (!password) {
      password = await promptPassword(`Introduza a palavra-passe para ${options.email}: `)
    }

    if (!password) {
      console.error('[Error] Palavra-passe é necessária para autenticação.')
      process.exit(1)
    }

    console.log(`[Auth] Autenticando utilizador ${options.email}...`)
    try {
      const authResult = await loginAppwrite(
        options.endpoint,
        options.projectId,
        options.email,
        password
      )
      applySessionToClient(client, options.projectId, authResult.sessionSecret)
      targetUserId = authResult.userId

      try {
        const account = new Account(client)
        const user = await account.get()
        targetUserId = user.$id
        console.log(`[Auth] Autenticado com sucesso: ${user.email} (ID: ${targetUserId})`)
      } catch {
        console.log(`[Auth] Sessão criada com sucesso. Utilizador: ${options.email} (ID: ${targetUserId})`)
      }
    } catch (authErr) {
      console.error('[Error] Falha na autenticação:', authErr.message || authErr)
      process.exit(1)
    }
  }

  if (!targetUserId) {
    console.error('[Error] Não foi possível determinar o ID do utilizador.')
    process.exit(1)
  }

  console.log(`\n[Info] Utilizador de destino: ${options.email} (ID: ${targetUserId})`)
  console.log(`[Info] Permissões que serão atribuídas a cada transação:`)
  console.log(`       - read("user:${targetUserId}")`)
  console.log(`       - update("user:${targetUserId}")`)
  console.log(`       - delete("user:${targetUserId}")`)

  const tablesDB = new TablesDB(client)
  const userPermissions = [
    Permission.read(Role.user(targetUserId)),
    Permission.update(Role.user(targetUserId)),
    Permission.delete(Role.user(targetUserId)),
  ]

  const readPerm = `read("user:${targetUserId}")`
  const updatePerm = `update("user:${targetUserId}")`
  const deletePerm = `delete("user:${targetUserId}")`

  let totalMigrated = 0
  let totalSkipped = 0
  let totalFailed = 0
  let offset = 0
  const limit = options.batchSize
  let hasMore = true

  console.log('\n[Migração] Iniciando verificação e atualização das transações...')

  while (hasMore) {
    try {
      const response = await executeWithRetry(() =>
        tablesDB.listRows({
          databaseId: options.databaseId,
          tableId: 'transactions',
          queries: [
            Query.limit(limit),
            Query.offset(offset),
          ],
        })
      )

      const rows = response.rows || []
      if (rows.length === 0) {
        hasMore = false
        break
      }

      console.log(`[Migração] Processando lote de ${rows.length} transações (offset: ${offset}, total na BD: ${response.total})...`)

      for (const row of rows) {
        // Verificar se a transação já tem as permissões do utilizador
        const currentPerms = Array.isArray(row.$permissions) ? row.$permissions : []
        const hasAllPerms =
          currentPerms.includes(readPerm) &&
          currentPerms.includes(updatePerm) &&
          currentPerms.includes(deletePerm)

        if (hasAllPerms) {
          totalSkipped++
          continue
        }

        const patchData = sanitizeTransactionData(row)

        try {
          await executeWithRetry(() =>
            tablesDB.updateRow({
              databaseId: options.databaseId,
              tableId: 'transactions',
              rowId: row.$id,
              data: patchData,
              permissions: userPermissions,
            })
          )
          totalMigrated++

          if (options.delay > 0) {
            await sleep(options.delay)
          }
        } catch (rowErr) {
          // Se falhar devido a validação de relacionamento, tenta limpar subCategory para null
          if (rowErr.message && rowErr.message.includes('relationship')) {
            try {
              await executeWithRetry(() =>
                tablesDB.updateRow({
                  databaseId: options.databaseId,
                  tableId: 'transactions',
                  rowId: row.$id,
                  data: { subCategory: null },
                  permissions: userPermissions,
                })
              )
              totalMigrated++
              if (options.delay > 0) {
                await sleep(options.delay)
              }
              continue
            } catch (fallbackErr) {
              totalFailed++
              console.error(`  [Erro] Falha ao atualizar transação ${row.$id}:`, fallbackErr.message || fallbackErr)
              continue
            }
          }

          totalFailed++
          console.error(`  [Erro] Falha ao atualizar transação ${row.$id}:`, rowErr.message || rowErr)
        }
      }

      offset += rows.length
      if (offset >= response.total || rows.length < limit) {
        hasMore = false
      }
    } catch (err) {
      console.error('[Erro] Falha ao listar transações:', err.message || err)
      hasMore = false
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(' Resumo da Migração')
  console.log('='.repeat(60))
  console.log(`Total de transações atualizadas:            ${totalMigrated}`)
  console.log(`Total já associadas (ignoradas):             ${totalSkipped}`)
  console.log(`Total de falhas:                            ${totalFailed}`)
  console.log(`Utilizador associado:                       ${options.email} (${targetUserId})`)
  console.log('='.repeat(60))
}

main().catch((err) => {
  console.error('[Fatal Error]:', err)
  process.exit(1)
})
