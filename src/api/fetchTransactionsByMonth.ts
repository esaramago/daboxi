'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import type { Categories, Transactions } from '@/types/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export default async function fetchTransactionsByMonth(date?: Date, type?: Categories['type']['code']) {
  await requireAuth()

  const today = new Date()
  const _date = date ? new Date(date) : today

  const startDate = new Date(_date.getFullYear(), _date.getMonth(), 1, 0, 0, 0, 0)
  const endDate = new Date(_date.getFullYear(), _date.getMonth() + 1, 0, 23, 59, 59, 999)

  try {
    const pb = await getPocketBase()
    const filterParts = [
      `date >= "${startDate.toISOString()}"`,
      `date <= "${endDate.toISOString()}"`
    ]

    if (type) {
      filterParts.push(`subCategory.category.type.code = "${type}"`)
    }

    const records = await pb.collection('transactions').getFullList({
      filter: filterParts.join(' && '),
      sort: '-date',
      expand: 'subCategory.category.type'
    })

    return {
      error: false,
      data: records.map(r => formatRecord<Transactions>(r))
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null
    }
  }
}