'use server'

import { getPocketBase } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

import { sanitizeTransactionUpdate, type AllowedTransactionUpdates } from './updateTransaction'

export interface TransactionUpdateItem {
  id: string
  fields: AllowedTransactionUpdates | Record<string, any>
}

export default async function updateTransactions(records: Array<TransactionUpdateItem>) {
  await requireAuth()

  if (!records || !Array.isArray(records) || records.length === 0) return

  try {
    const pb = await getPocketBase()
    const validUpdates = records
      .map(record => {
        if (!record || typeof record.id !== 'string' || !record.id.trim()) return null
        const cleanFields = sanitizeTransactionUpdate(record.fields)
        if (Object.keys(cleanFields).length === 0) return null
        return {
          id: record.id.trim(),
          fields: cleanFields,
        }
      })
      .filter((item): item is { id: string; fields: AllowedTransactionUpdates } => item !== null)

    if (validUpdates.length === 0) return

    await Promise.all(
      validUpdates.map(record => pb.collection('transactions').update(record.id, record.fields))
    )
  } catch (error: any) {
    console.error('[updateTransactions] Error updating batch:', error)
  }
}