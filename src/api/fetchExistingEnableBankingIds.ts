'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function fetchExistingEnableBankingIds() {
  await requireAuth()

  const [ebResult, txResult] = await Promise.all([
    fetchAppwriteDB('enablebanking_transactions', [
      Query.select(['$id', 'enableBankingId']),
    ], 5000),
    fetchAppwriteDB('transactions', [
      Query.select(['$id', 'enableBankingId']),
    ], 5000),
  ])

  const ids = new Set<string>()

  if (ebResult.data?.rows) {
    for (const row of ebResult.data.rows) {
      if (typeof row.enableBankingId === 'string' && row.enableBankingId.length > 0) {
        ids.add(row.enableBankingId)
      }
    }
  }

  if (txResult.data?.rows) {
    for (const row of txResult.data.rows) {
      if (typeof row.enableBankingId === 'string' && row.enableBankingId.length > 0) {
        ids.add(row.enableBankingId)
      }
    }
  }

  return {
    error: null,
    data: Array.from(ids)
  }
}

