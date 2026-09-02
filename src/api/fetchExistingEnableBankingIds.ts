'use server'

import { getPocketBase } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export default async function fetchExistingEnableBankingIds() {
  await requireAuth()

  try {
    const pb = await getPocketBase()

    const [ebRecords, txRecords] = await Promise.all([
      pb.collection('enablebanking_transactions').getFullList({ fields: 'id,enableBankingId' }),
      pb.collection('transactions').getFullList({ fields: 'id,enableBankingId', filter: 'enableBankingId != ""' })
    ])

    const ids = new Set<string>()

    for (const row of ebRecords) {
      if (typeof row.enableBankingId === 'string' && row.enableBankingId.length > 0) {
        ids.add(row.enableBankingId)
      }
    }

    for (const row of txRecords) {
      if (typeof row.enableBankingId === 'string' && row.enableBankingId.length > 0) {
        ids.add(row.enableBankingId)
      }
    }

    return {
      error: null,
      data: Array.from(ids)
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: []
    }
  }
}
