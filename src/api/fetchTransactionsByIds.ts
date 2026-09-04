'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'
import type { Transactions } from '@/types/pocketbase'

export default async function fetchTransactionsByIds(ids: string[]) {
  await requireAuth()

  const validIds = Array.isArray(ids)
    ? ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : []

  if (validIds.length === 0) {
    return { error: false, data: [] }
  }

  try {
    const pb = await getPocketBase()
    const filterParams: Record<string, string> = {}
    const clauses = validIds.map((id, index) => {
      const key = `id${index}`
      filterParams[key] = id
      return `id = {:${key}}`
    })
    const filter = pb.filter(clauses.join(' || '), filterParams)
    
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