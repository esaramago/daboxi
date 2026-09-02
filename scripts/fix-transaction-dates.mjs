#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, '../pb_data/data.db')
const backupPath = path.resolve(__dirname, '../pb_data/data.db.bak')

const UPDATE_SQL = `
UPDATE transactions
SET date = strftime('%Y-%m-%d %H:%M:%S.000Z', datetime(substr(date, 1, 19), '+1 hour'))
WHERE date LIKE '% 23:00:00.000Z';
`

const COUNT_23_SQL = `
SELECT COUNT(*) as count FROM transactions WHERE date LIKE '% 23:00:00.000Z';
`

const COUNT_TOTAL_SQL = `
SELECT COUNT(*) as count FROM transactions;
`

function createBackup() {
  if (fs.existsSync(dbPath)) {
    console.log(`1. Criando backup da base de dados em ${backupPath}...`)
    fs.copyFileSync(dbPath, backupPath)
    console.log('   Backup concluído.')
  }
}

async function runViaNodeSqlite() {
  const { DatabaseSync } = await import('node:sqlite')
  const db = new DatabaseSync(dbPath)

  const countBefore = db.prepare(COUNT_23_SQL).get().count
  console.log(`2. Encontradas ${countBefore} transações com '23:00:00.000Z'.`)

  if (countBefore === 0) {
    console.log('   Nenhuma transação precisa de correção.')
    db.close()
    return true
  }

  db.exec(UPDATE_SQL)

  const countAfter = db.prepare(COUNT_23_SQL).get().count
  const total = db.prepare(COUNT_TOTAL_SQL).get().count
  console.log(`3. Atualização concluída com sucesso (via node:sqlite):`)
  console.log(`   - Transações com 23:00:00.000Z restantes: ${countAfter}`)
  console.log(`   - Total de transações: ${total}`)

  db.close()
  return true
}

function runViaSqliteCli() {
  const countBeforeOutput = execSync(`sqlite3 "${dbPath}" "${COUNT_23_SQL}"`, { encoding: 'utf-8' }).trim()
  const countBefore = Number(countBeforeOutput) || 0
  console.log(`2. Encontradas ${countBefore} transações com '23:00:00.000Z'.`)

  if (countBefore === 0) {
    console.log('   Nenhuma transação precisa de correção.')
    return true
  }

  execSync(`sqlite3 "${dbPath}" "${UPDATE_SQL}"`)

  const countAfter = Number(execSync(`sqlite3 "${dbPath}" "${COUNT_23_SQL}"`, { encoding: 'utf-8' }).trim()) || 0
  const total = Number(execSync(`sqlite3 "${dbPath}" "${COUNT_TOTAL_SQL}"`, { encoding: 'utf-8' }).trim()) || 0

  console.log(`3. Atualização concluída com sucesso (via sqlite3 CLI):`)
  console.log(`   - Transações com 23:00:00.000Z restantes: ${countAfter}`)
  console.log(`   - Total de transações: ${total}`)
  return true
}

async function runViaPocketBaseApi() {
  console.log('Tentando ligar via PocketBase API...')
  const PocketBase = (await import('pocketbase')).default
  const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
  const pb = new PocketBase(pbUrl)
  pb.autoCancellation(false)

  const adminEmail = process.env.PB_ADMIN_EMAIL || 'admin@daboxi.local'
  const adminPassword = process.env.PB_ADMIN_PASSWORD || 'Admin123456789!'

  try {
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword)
  } catch {
    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword)
    } catch (err) {
      console.error('Não foi possível autenticar como superuser/admin na PocketBase API:', err.message)
      return false
    }
  }

  const records = await pb.collection('transactions').getFullList({
    filter: 'date ~ "23:00:00"',
  })

  console.log(`2. Encontradas ${records.length} transações com '23:00:00' via API.`)
  if (records.length === 0) {
    console.log('   Nenhuma transação precisa de correção.')
    return true
  }

  console.log(`   A atualizar ${records.length} transações...`)
  let updated = 0
  for (const record of records) {
    const rawDate = record.date // e.g. "2026-08-31 23:00:00.000Z"
    const d = new Date(rawDate.replace(' ', 'T'))
    d.setUTCHours(d.getUTCHours() + 1)
    const newDateStr = d.toISOString().replace('T', ' ')

    await pb.collection('transactions').update(record.id, {
      date: newDateStr
    })
    updated++
  }

  console.log(`3. Atualização concluída: ${updated} transações corrigidas via API.`)
  return true
}

async function main() {
  console.log('--- Daboxi: Correção de Datas de Transações ---')

  if (!fs.existsSync(dbPath)) {
    console.log(`Ficheiro de base de dados não encontrado em ${dbPath}. Tentando via PocketBase API...`)
    const success = await runViaPocketBaseApi()
    if (!success) {
      process.exit(1)
    }
    return
  }

  createBackup()

  // 1. Tentar node:sqlite (Node 22+)
  try {
    const ok = await runViaNodeSqlite()
    if (ok) return
  } catch (err) {
    // node:sqlite não disponível (Node < 22)
  }

  // 2. Tentar sqlite3 CLI
  try {
    const ok = runViaSqliteCli()
    if (ok) return
  } catch (err) {
    // sqlite3 CLI não disponível
  }

  // 3. Tentar PocketBase API
  try {
    const ok = await runViaPocketBaseApi()
    if (ok) return
  } catch (err) {
    console.error('Erro ao executar via PocketBase API:', err.message)
  }

  console.error('\nNão foi possível atualizar automaticamente.')
  console.error('Em alternativa, podes executar diretamente o seguinte comando SQL na base de dados SQLite:')
  console.error(UPDATE_SQL)
  process.exit(1)
}

main().catch(err => {
  console.error('Erro:', err)
  process.exit(1)
})

