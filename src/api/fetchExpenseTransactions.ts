'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'
import type { Transactions } from '@/types/pocketbase'

export default async function fetchExpenseTransactions(size?: number) {
  await requireAuth()

  try {
    const pb = await getPocketBase()
    const limit = size || 500

    const records = await pb.collection('transactions').getList(1, limit, {
      filter: 'value < 0 && (refundsIds = "" || refundsIds = null)',
      sort: '-date,description',
      expand: 'subCategory.category.type',
    })

    return {
      error: false,
      data: records.items.map(r => formatRecord<Transactions>(r)),
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null,
    }
  }
}