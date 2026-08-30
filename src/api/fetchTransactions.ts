'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'
import fetchCategories from './fetchCategories'
import type { Categories, Transactions } from '@/appwrite.d'

export default async function fetchTransactions(size?: number) {
  await requireAuth()
  
  const { data, error } = await fetchAppwriteDB('transactions', [
    Query.select([
      '$id',
      'date',
      'value',
      'netValue',
      'description',
      'niceDescription',
      'subCategory.$id',
      'subCategory.code',
      'subCategory.description',
      'subCategory.icon',
      'subCategory.category.code',
      'enableBankingId',
    ]),
    Query.orderDesc('date'),
    Query.orderDesc('$createdAt')
  ], size)

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