import PocketBase from 'pocketbase'
import fs from 'fs'
import path from 'path'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@daboxi.local'
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'Admin123456789!'

const pb = new PocketBase(PB_URL)
pb.autoCancellation(false)

async function authenticate() {
  console.log(`[Migration] Connecting to PocketBase at ${PB_URL}...`)
  try {
    // PocketBase 0.23+ uses _superusers collection
    await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)
    console.log('[Migration] Authenticated as superuser.')
  } catch (err) {
    try {
      // Fallback for older PocketBase
      await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)
      console.log('[Migration] Authenticated as admin (legacy).')
    } catch (adminErr) {
      console.error('[Migration] Failed to authenticate admin/superuser:', err.message)
      throw err
    }
  }
}

async function ensureCollections() {
  console.log('[Migration] Setting up collections...')
  const existingCollections = await pb.collections.getFullList()
  const existingNames = new Set(existingCollections.map(c => c.name))

  // 1. Update 'users' collection to have custom fields
  const usersCollection = existingCollections.find(c => c.name === 'users')
  if (usersCollection) {
    let modified = false
    const fields = usersCollection.fields || usersCollection.schema || []
    
    // Check if fields already exist
    const hasField = (name) => fields.some(f => f.name === name)
    
    if (!hasField('enablebanking_bank_name')) {
      fields.push({ name: 'enablebanking_bank_name', type: 'text', required: false })
      modified = true
    }
    if (!hasField('enablebanking_country')) {
      fields.push({ name: 'enablebanking_country', type: 'text', required: false })
      modified = true
    }
    if (!hasField('enablebanking_enabled')) {
      fields.push({ name: 'enablebanking_enabled', type: 'bool', required: false })
      modified = true
    }
    
    if (modified) {
      console.log('[Migration] Updating users collection fields...')
      await pb.collections.update(usersCollection.id, {
        fields: fields
      })
    }
  }

  // 2. Types collection
  let typesCol = existingCollections.find(c => c.name === 'types')
  if (!typesCol) {
    console.log('[Migration] Creating types collection...')
    typesCol = await pb.collections.create({
      name: 'types',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'code', type: 'text', required: true },
        { name: 'description', type: 'text', required: true }
      ]
    })
  }

  // 3. Categories collection
  let catCol = existingCollections.find(c => c.name === 'categories')
  if (!catCol) {
    console.log('[Migration] Creating categories collection...')
    catCol = await pb.collections.create({
      name: 'categories',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'code', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'icon', type: 'text', required: true },
        {
          name: 'type',
          type: 'relation',
          required: false,
          collectionId: typesCol.id,
          cascadeDelete: false,
          maxSelect: 1
        }
      ]
    })
  }

  // 4. Subcategories collection
  let subCol = existingCollections.find(c => c.name === 'subcategories')
  if (!subCol) {
    console.log('[Migration] Creating subcategories collection...')
    subCol = await pb.collections.create({
      name: 'subcategories',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'code', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'icon', type: 'text', required: true },
        {
          name: 'category',
          type: 'relation',
          required: false,
          collectionId: catCol.id,
          cascadeDelete: false,
          maxSelect: 1
        },
        { name: 'budget', type: 'number', required: false }
      ]
    })
  }

  // 5. Transactions collection
  let transCol = existingCollections.find(c => c.name === 'transactions')
  if (!transCol) {
    console.log('[Migration] Creating transactions collection...')
    transCol = await pb.collections.create({
      name: 'transactions',
      type: 'base',
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != "" && user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'value', type: 'number', required: true },
        { name: 'netValue', type: 'number', required: false },
        { name: 'description', type: 'text', required: false },
        { name: 'niceDescription', type: 'text', required: true },
        { name: 'notes', type: 'text', required: false },
        {
          name: 'subCategory',
          type: 'relation',
          required: false,
          collectionId: subCol.id,
          cascadeDelete: false,
          maxSelect: 1
        },
        { name: 'refundsIds', type: 'text', required: false },
        { name: 'enableBankingId', type: 'text', required: false },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCollection.id,
          cascadeDelete: false,
          maxSelect: 1
        }
      ]
    })
  }

  // 6. Bank sessions collection
  let bankCol = existingCollections.find(c => c.name === 'bank_sessions')
  if (!bankCol) {
    console.log('[Migration] Creating bank_sessions collection...')
    bankCol = await pb.collections.create({
      name: 'bank_sessions',
      type: 'base',
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != "" && user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      fields: [
        { name: 'sessionId', type: 'text', required: false },
        { name: 'bankName', type: 'text', required: false },
        { name: 'country', type: 'text', required: false },
        { name: 'accounts', type: 'json', required: false },
        { name: 'validUntil', type: 'text', required: false },
        { name: 'status', type: 'text', required: false },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCollection.id,
          cascadeDelete: false,
          maxSelect: 1
        }
      ]
    })
  }

  // 7. Enablebanking transactions collection
  let ebCol = existingCollections.find(c => c.name === 'enablebanking_transactions')
  if (!ebCol) {
    console.log('[Migration] Creating enablebanking_transactions collection...')
    ebCol = await pb.collections.create({
      name: 'enablebanking_transactions',
      type: 'base',
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != "" && user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      fields: [
        { name: 'enableBankingId', type: 'text', required: true },
        { name: 'status', type: 'text', required: true },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCollection.id,
          cascadeDelete: false,
          maxSelect: 1
        }
      ]
    })
  }

  return {
    usersCollection,
    typesCol,
    catCol,
    subCol,
    transCol,
    bankCol,
    ebCol
  }
}

async function migrateData() {
  const dataPath = path.resolve('scripts/extracted_appwrite_data.json')
  if (!fs.existsSync(dataPath)) {
    throw new Error('Data file scripts/extracted_appwrite_data.json not found! Run extract script first.')
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  
  // Mapping objects to translate Appwrite IDs -> PocketBase IDs
  const userIdMap = new Map()
  const typeIdMap = new Map()
  const catIdMap = new Map()
  const subIdMap = new Map()

  // 1. Users
  console.log('\n--- Migrating Users ---')
  for (const u of rawData.users) {
    try {
      let pbUser
      try {
        pbUser = await pb.collection('users').getFirstListItem(`email="${u.email}"`)
        console.log(`User already exists: ${u.email} (${pbUser.id})`)
      } catch (notFound) {
        console.log(`Creating user: ${u.email} (${u.name})...`)
        pbUser = await pb.collection('users').create({
          email: u.email,
          emailVisibility: true,
          password: 'ChangeMe123456!',
          passwordConfirm: 'ChangeMe123456!',
          name: u.name,
          enablebanking_bank_name: u.prefs?.enablebanking_bank_name || '',
          enablebanking_country: u.prefs?.enablebanking_country || ''
        })
      }
      userIdMap.set(u.appwriteId, pbUser.id)
    } catch (err) {
      console.error(`Error migrating user ${u.email}:`, err.message)
    }
  }

  // 2. Types
  console.log('\n--- Migrating Types ---')
  for (const t of rawData.types) {
    try {
      let pbType
      try {
        pbType = await pb.collection('types').getFirstListItem(`code="${t.code}"`)
      } catch {
        pbType = await pb.collection('types').create({
          code: t.code,
          description: t.description
        })
      }
      typeIdMap.set(t.appwriteId, pbType.id)
      console.log(`Type: ${t.code} -> ${pbType.id}`)
    } catch (err) {
      console.error(`Error migrating type ${t.code}:`, err.message)
    }
  }

  // 3. Categories
  console.log('\n--- Migrating Categories ---')
  for (const c of rawData.categories) {
    try {
      let pbCat
      const typePbId = typeIdMap.get(c.type) || null
      try {
        pbCat = await pb.collection('categories').getFirstListItem(`code="${c.code}"`)
      } catch {
        pbCat = await pb.collection('categories').create({
          code: c.code,
          description: c.description,
          icon: c.icon,
          type: typePbId
        })
      }
      catIdMap.set(c.appwriteId, pbCat.id)
      console.log(`Category: ${c.code} -> ${pbCat.id}`)
    } catch (err) {
      console.error(`Error migrating category ${c.code}:`, err.message)
    }
  }

  // 4. Subcategories
  console.log('\n--- Migrating Subcategories ---')
  for (const s of rawData.subcategories) {
    try {
      let pbSub
      const catPbId = catIdMap.get(s.category) || null
      try {
        pbSub = await pb.collection('subcategories').getFirstListItem(`code="${s.code}"`)
      } catch {
        pbSub = await pb.collection('subcategories').create({
          code: s.code,
          description: s.description,
          icon: s.icon,
          category: catPbId,
          budget: s.budget || null
        })
      }
      subIdMap.set(s.appwriteId, pbSub.id)
      console.log(`Subcategory: ${s.code} -> ${pbSub.id}`)
    } catch (err) {
      console.error(`Error migrating subcategory ${s.code}:`, err.message)
    }
  }

  // 5. Transactions
  console.log('\n--- Migrating Transactions ---')
  const defaultUserId = userIdMap.values().next().value
  
  // Clear any existing partial transactions
  const existingRecords = await pb.collection('transactions').getFullList({ fields: 'id' })
  if (existingRecords.length > 0 && existingRecords.length < rawData.transactions.length) {
    console.log(`Clearing ${existingRecords.length} partial transactions...`)
    for (const r of existingRecords) {
      await pb.collection('transactions').delete(r.id)
    }
  }

  const currentCount = (await pb.collection('transactions').getList(1, 1, { requestKey: null })).totalItems
  if (currentCount >= rawData.transactions.length) {
    console.log(`Transactions already fully migrated (${currentCount} records). Skipping.`)
  } else {
    console.log(`Importing ${rawData.transactions.length} transactions in parallel chunks...`)
    let inserted = 0
    const chunkSize = 30

    for (let i = 0; i < rawData.transactions.length; i += chunkSize) {
      const chunk = rawData.transactions.slice(i, i + chunkSize)
      
      await Promise.all(chunk.map(async (t) => {
        const userPbId = userIdMap.get(t.appwriteUserId) || defaultUserId
        const subPbId = subIdMap.get(t.subCategory) || null

        let dateStr = t.date
        try {
          const raw = String(t.date).trim()
          if (raw.includes(' ') && !raw.includes('T')) {
            dateStr = new Date(raw.replace(' ', 'T') + 'Z').toISOString()
          } else {
            dateStr = new Date(t.date).toISOString()
          }
        } catch {
          dateStr = new Date().toISOString()
        }

        try {
          await pb.collection('transactions').create({
            date: dateStr,
            value: t.value,
            netValue: t.netValue,
            description: t.description || '',
            niceDescription: t.niceDescription || '',
            notes: t.notes || '',
            subCategory: subPbId,
            refundsIds: t.refundsIds || '',
            enableBankingId: t.enableBankingId || '',
            user: userPbId
          }, { requestKey: null })
          inserted++
        } catch (err) {
          console.error(`\nError creating transaction:`, err.message)
        }
      }))

      process.stdout.write(`\rImported ${inserted}/${rawData.transactions.length} transactions...`)
    }
    console.log(`\nFinished importing transactions. Total: ${inserted}`)
  }

  // 6. Bank Sessions
  console.log('\n--- Migrating Bank Sessions ---')
  for (const b of rawData.bank_sessions) {
    try {
      const userPbId = userIdMap.get(b.appwriteUserId) || defaultUserId
      let accountsData = null
      try {
        accountsData = b.accounts ? JSON.parse(b.accounts) : null
      } catch {
        accountsData = b.accounts
      }
      await pb.collection('bank_sessions').create({
        sessionId: b.sessionId || '',
        bankName: b.bankName || '',
        country: b.country || '',
        accounts: accountsData,
        validUntil: b.validUntil || '',
        status: b.status || '',
        user: userPbId
      })
      console.log(`Bank session imported: ${b.sessionId}`)
    } catch (err) {
      console.error(`Error importing bank session ${b.sessionId}:`, err.message)
    }
  }

  // 7. EnableBanking transactions
  console.log('\n--- Migrating EnableBanking Txs ---')
  for (const eb of rawData.enablebanking_transactions) {
    try {
      const userPbId = userIdMap.get(eb.appwriteUserId) || defaultUserId
      await pb.collection('enablebanking_transactions').create({
        enableBankingId: eb.enableBankingId,
        status: eb.status || 'imported',
        user: userPbId
      })
    } catch (err) {
      // ignore duplicates or errors
    }
  }
  console.log(`Finished enablebanking transactions.`)

  console.log('\n=========================================')
  console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!')
  console.log('=========================================')
}

async function main() {
  try {
    await authenticate()
    await ensureCollections()
    await migrateData()
  } catch (err) {
    console.error('[Migration FAILED]:', err)
    process.exit(1)
  }
}

main()
