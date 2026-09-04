'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth, getAuthenticatedUserId } from '@/lib/pocketbaseServer'
import type { Transactions } from '@/types/pocketbase'

import { sanitizeTransactionUpdate } from '@/utils/sanitizeTransaction'

export default async function submitTransactions(data: Array<Transactions>) {
  await requireAuth()

  if (!data || !Array.isArray(data) || data.length === 0) return []

  const userId = await getAuthenticatedUserId()
  const pb = await getPocketBase()

  const results = []
  for (const transaction of data) {
    try {
      const payload = {
        ...sanitizeTransactionUpdate(transaction),
        user: userId,
      }
      const record = await pb.collection('transactions').create(payload)
      results.push({
        data: formatRecord(record),
        error: null,
      })
    } catch (err: any) {
      results.push({
        data: null,
        error: err.message || err,
      })
    }
  }

  return results
}