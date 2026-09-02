'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'
import type { Transactions } from '@/types/pocketbase'

export default async function fetchTransactions(size?: number) {
  await requireAuth()

  try {
    const pb = await getPocketBase()
    const limit = size || 500

    const records = await pb.collection('transactions').getList(1, limit, {
      sort: '-date,-id',
      expand: 'subCategory.category.type',
    })

    return {
      error: false,
      data: records.items.map(r => formatRecord<Transactions>(r)),
    }
  } catch (error: any) {
    console.error('[fetchTransactions] Error:', error)
    return {
      error: error.message || error,
      data: null,
    }
  }
}