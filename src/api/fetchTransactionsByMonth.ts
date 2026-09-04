'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import type { Categories, Transactions } from '@/types/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export default async function fetchTransactionsByMonth(date?: Date | string, type?: Categories['type']['code']) {
  await requireAuth()

  let year: number
  let month: number // 1-indexed: 1 to 12

  if (typeof date === 'string' && /^\d{4}-\d{2}/.test(date)) {
    const parts = date.split('-')
    year = Number(parts[0])
    month = Number(parts[1])
  } else if (date instanceof Date && !isNaN(date.getTime())) {
    year = date.getUTCFullYear()
    month = date.getUTCMonth() + 1
  } else {
    const now = new Date()
    year = now.getUTCFullYear()
    month = now.getUTCMonth() + 1
  }

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const startStr = `${year}-${String(month).padStart(2, '0')}-01 00:00:00.000Z`
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59.999Z`

  try {
    const pb = await getPocketBase()
    const filterParams: Record<string, string> = {
      startDate: startStr,
      endDate: endStr,
    }
    const filterClauses = [
      'date >= {:startDate}',
      'date <= {:endDate}',
    ]

    if (type && typeof type === 'string' && type.trim() !== '') {
      filterParams.type = type
      filterClauses.push('subCategory.category.type.code = {:type}')
    }

    const filter = pb.filter(filterClauses.join(' && '), filterParams)

    const records = await pb.collection('transactions').getFullList({
      filter,
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