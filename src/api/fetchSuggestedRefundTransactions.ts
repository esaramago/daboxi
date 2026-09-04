'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'
import type { Transactions } from '@/types/pocketbase'

export default async function fetchSuggestedRefundTransactions(value: number) {
  await requireAuth()

  const numValue = Number(value)
  if (isNaN(numValue) || !isFinite(numValue)) {
    return {
      error: 'Valor inválido',
      data: null,
    }
  }

  const negativeValue = Number((-numValue).toFixed(2))
  const negativeDouble = Number((-numValue * 2).toFixed(2))
  const minValue = Number((negativeDouble - 0.01).toFixed(2))
  const maxValue = Number((negativeDouble + 0.01).toFixed(2))

  try {
    const pb = await getPocketBase()
    const filter = pb.filter(
      'value = {:negativeValue} || value = {:negativeDouble} || (value >= {:minValue} && value <= {:maxValue})',
      { negativeValue, negativeDouble, minValue, maxValue }
    )

    const records = await pb.collection('transactions').getList(1, 5, {
      filter,
      sort: '-date',
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