'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'
import type { Transactions } from '@/types/pocketbase'

export interface FetchTransactionsOptions {
  category?: string
  subCategory?: string
  size?: number
}

export default async function fetchTransactions(options: FetchTransactionsOptions = {}) {
  await requireAuth()

  try {
    const pb = await getPocketBase()

    const size = options.size || 100
    const filterClauses: string[] = []
    const filterParams: Record<string, string> = {}

    if (options.subCategory && options.subCategory.trim()) {
      filterParams.subCategory = options.subCategory.trim()
      filterClauses.push('subCategory.code = {:subCategory}')
    } else if (options.category && options.category.trim()) {
      filterParams.category = options.category.trim()
      filterClauses.push('subCategory.category.code = {:category}')
    }

    const filter = filterClauses.length > 0 ? pb.filter(filterClauses.join(' && '), filterParams) : undefined

    const records = await pb.collection('transactions').getList(1, size, {
      sort: '-date,-id',
      expand: 'subCategory.category.type',
      ...(filter ? { filter } : {}),
    })

    return {
      error: false,
      data: records.items.map(r => formatRecord<Transactions>(r)),
      totalItems: records.totalItems,
      totalPages: records.totalPages,
      page: records.page,
      perPage: records.perPage,
    }
  } catch (error: any) {
    console.error('[fetchTransactions] Error:', error)
    return {
      error: error.message || error,
      data: null,
      totalItems: 0,
      totalPages: 0,
      page: 1,
      perPage: 0,
    }
  }
}