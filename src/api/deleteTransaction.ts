'use server'

import { getPocketBase } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export default async function deleteTransaction(id: string) {
  await requireAuth()

  if (!id) return

  try {
    const pb = await getPocketBase()
    await pb.collection('transactions').delete(id)
  } catch (error: any) {
    console.error('[deleteTransaction] Error deleting transaction:', error)
  }
}