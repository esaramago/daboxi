'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function fetchSuggestedRefundTransactions(value: number) {
  await requireAuth()

  const negativeValue = value * -1
  const negativeDouble = (value * 2) * -1
  const minValue = Number((negativeDouble - 0.01).toFixed(2))
  const maxValue = Number((negativeDouble + 0.01).toFixed(2))

  const { data, error } = await fetchAppwriteDB('transactions', [
    Query.select([
      '*',
      'subCategory.*',
      'subCategory.category.type.code'
    ]),
    Query.equal('value', [negativeValue, negativeDouble, minValue, maxValue]),
    Query.orderDesc('date'),
  ], 5)

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