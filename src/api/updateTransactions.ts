'use server'

import { updateAppwriteRow } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

interface Record {
  id: string
  fields: Object
}

export default async function updateTransactions(records: Array<Record>) {
  await requireAuth()

  await Promise.all(
    records.map(record => updateAppwriteRow('transactions', record.id, record.fields))
  )
}