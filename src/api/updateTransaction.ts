'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export default async function updateTransaction(id: string, data: object) {
  await requireAuth()

  if (!id) return

  try {
    const pb = await getPocketBase()
    const updated = await pb.collection('transactions').update(id, data)
    return {
      error: null,
      data: formatRecord(updated)
    }
  } catch (error: any) {
    console.error('[updateTransaction] Error updating transaction:', error)
    return {
      error: error.message || error,
      data: null
    }
  }
}