'use server'

import { getPocketBase } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export interface TransactionUpdateItem {
  id: string
  fields: Record<string, any>
}

export default async function updateTransactions(records: Array<TransactionUpdateItem>) {
  await requireAuth()

  if (!records || records.length === 0) return

  try {
    const pb = await getPocketBase()
    await Promise.all(
      records.map(record => pb.collection('transactions').update(record.id, record.fields))
    )
  } catch (error: any) {
    console.error('[updateTransactions] Error updating batch:', error)
  }
}