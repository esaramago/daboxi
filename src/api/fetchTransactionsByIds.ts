'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'
import type { Transactions } from '@/types/pocketbase'

export default async function fetchTransactionsByIds(ids: string[]) {
  await requireAuth()

  if (!ids || ids.length === 0) {
    return { error: false, data: [] }
  }

  try {
    const pb = await getPocketBase()
    const filter = ids.map(id => `id = "${id}"`).join(' || ')
    
    const records = await pb.collection('transactions').getFullList({
      filter,
      expand: 'subCategory.category.type',
    })

    return {
      error: false,
      data: records.map(r => formatRecord<Transactions>(r)),
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null,
    }
  }
}