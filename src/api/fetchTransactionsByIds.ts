'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function fetchTransactionsByIds(ids: string[]) {
  await requireAuth()

  if (!ids) return

  const { data, error } = await fetchAppwriteDB('transactions', [
    Query.select([
      '$id',
      'date',
      'value',
      'netValue',
      'description',
      'niceDescription',
      'subCategory.*',
      'subCategory.category',
      'subCategory.category.code',
    ]),
    Query.equal('$id', ids),
  ])

  if (error) {
    return {
      error: error,
      data: null,
    }
  } else {
    return {
      error: false,
      data: data.rows,
    }
  }
}