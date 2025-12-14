'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import type { Categories, Transactions } from '@/appwrite.d'
import { requireAuth } from '@/lib/appwriteServer'
import fetchCategories from './fetchCategories'

export default async function fetchTransactionsByMonth(date?: Date, type?: Categories['type']['code']) {
  await requireAuth()

  const today = new Date
  const _date = date ? new Date(date) : today

  // get first second of the month
  const startDate = new Date(_date)
  startDate.setDate(0) // TOFIX: server time + summer time
  startDate.setHours(23,0,0,0) // TOFIX: server time + summer time

  // get last second of the month
  const endDate = new Date(_date.getFullYear(), _date.getMonth() + 1, 0)
  endDate.setHours(23,59,59,999)

  const queries = [
    Query.select(['value',
      'netValue',
      'subCategory.description',
      'subCategory.code',
      'subCategory.budget',
      'subCategory.category.code',
    ]),
    Query.greaterThan('date', startDate.toISOString()),
    Query.lessThan('date', endDate.toISOString()),
    Query.orderDesc('date'),
  ]

  if (type) {
    queries.push(Query.equal('subCategory.category.type.code', type))
  }

  const { data, error } = await fetchAppwriteDB('transactions', queries)

  if (error) {
    return {
      error: error,
      data: null,
    }
  } else {

    const { data: categories, error: categoriesError } = await fetchCategories()
    if (categoriesError) {
      return {
        error: categoriesError,
        data: null,
      }
    }

    const transactions: Transactions[] = data.rows.map((transaction: Transactions) => {
      const category = categories.find((category: Categories) => category.code === transaction.subCategory?.category?.code)
      return {
        ...transaction,
        subCategory: {
          ...transaction.subCategory,
          category: {
            code: category?.code,
            $id: category?.$id,
            type: {
              code: category?.type?.code,
              $id: category?.type?.$id,
            },
          }
        },
      }
    })

    return {
      error: false,
      data: transactions,
    }
  }
}