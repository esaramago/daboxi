'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function fetchExpenseTransactions(size?: number) {
  await requireAuth()

  const { data, error } = await fetchAppwriteDB('transactions', [
    Query.select([
      '*',
      'subCategory.*',
      'subCategory.category',
      'subCategory.category.type.code',
    ]),
    Query.lessThan('value', 0),
    Query.or([
      Query.equal('refundsIds', ''),
      Query.isNull('refundsIds'),
    ]),
    Query.orderDesc('date'),
    Query.orderAsc('description'),
  ], size)

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