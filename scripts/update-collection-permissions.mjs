#!/usr/bin/env node

/**
 * Script to update Collection-Level Permissions in Appwrite remote database.
 * Sets permissions to ['create("users")'] and enables Document Security (Row Security).
 * 
 * Usage:
 *   node scripts/update-collection-permissions.mjs --apiKey <appwrite_server_api_key>
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'

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
    apiKey: process.env.APPWRITE_API_KEY || '',
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://appwrite.emanuelsaramago.com/v1',
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '693346e6003456a9a668',
    databaseId: process.env.APPWRITE_DATABASE_ID || '693347b20038c67958ec',
    help: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--apiKey' && args[i + 1]) options.apiKey = args[++i]
    if (arg === '--endpoint' && args[i + 1]) options.endpoint = args[++i]
    if (arg === '--project' && args[i + 1]) options.projectId = args[++i]
    if (arg === '--database' && args[i + 1]) options.databaseId = args[++i]
    if (arg === '--help' || arg === '-h') options.help = true
  }

  return options
}

function showHelp() {
  console.log(`
Daboxi - Script de Atualização de Permissões das Coleções / Tabelas

Opções:
  --apiKey <key>    Chave de API do servidor Appwrite (scope: databases.write)
  --endpoint <url>  Endpoint do Appwrite (default: de .env)
  --project <id>    Project ID do Appwrite (default: de .env)
  --database <id>   Database ID do Appwrite (default: de .env)
  --help, -h        Exibe esta mensagem de ajuda
`)
}

async function promptInput(promptText) {
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

async function main() {
  const options = parseArgs()

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  console.log('='.repeat(60))
  console.log(' Daboxi - Atualização de Permissões das Coleções / Tabelas')
  console.log('='.repeat(60))
  console.log(`Endpoint:   ${options.endpoint}`)
  console.log(`Project ID: ${options.projectId}`)
  console.log(`Database:   ${options.databaseId}`)
  console.log('='.repeat(60))

  let apiKey = options.apiKey
  if (!apiKey) {
    apiKey = await promptInput('Introduza a Chave de API do Appwrite (com scope databases.write): ')
  }

  if (!apiKey) {
    console.error('[Error] API Key é necessária para atualizar permissões das coleções via API.')
    console.log('\nEm alternativa, podes alterar manualmente na consola do Appwrite:')
    console.log('  1. Acede a Databases > Daboxi > transactions > Settings')
    console.log('  2. Em "Permissions", remove "All Users (Read)", "All Users (Update)", "All Users (Delete)"')
    console.log('  3. Mantém apenas "All Users (Create)"')
    console.log('  4. Garante que "Document Security" está Ativo (Enabled)')
    process.exit(1)
  }

  const collections = [
    { id: 'transactions', name: 'transactions' },
    { id: 'bank_sessions', name: 'bank_sessions' },
    { id: 'enablebanking_transactions', name: 'enablebanking_transactions' },
  ]

  for (const col of collections) {
    console.log(`\nAtualizando permissões da coleção "${col.id}"...`)

    try {
      const response = await fetch(`${options.endpoint}/databases/${options.databaseId}/collections/${col.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': options.projectId,
          'X-Appwrite-Key': apiKey,
        },
        body: JSON.stringify({
          name: col.name,
          permissions: ['create("users")'],
          documentSecurity: true,
          enabled: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`[Erro] Falha ao atualizar "${col.id}":`, data.message || data)
      } else {
        console.log(`[Sucesso] Coleção "${col.id}" atualizada com sucesso!`)
        console.log(`          Permissões: ${JSON.stringify(data.$permissions || data.permissions)}`)
        console.log(`          Document Security: ${data.documentSecurity}`)
      }
    } catch (err) {
      console.error(`[Erro] Falha ao comunicar com a API para "${col.id}":`, err.message || err)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(' Concluído')
  console.log('='.repeat(60))
}

main().catch((err) => {
  console.error('[Fatal Error]:', err)
  process.exit(1)
})
