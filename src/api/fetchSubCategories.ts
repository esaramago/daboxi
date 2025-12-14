'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import type { SubCategories, Types } from '@/appwrite.d'
import { requireAuth } from '@/lib/appwriteServer'

const getSubCategoriesByType = async (transactionType: Types['code']) => {

  const types = transactionType === 'income' ? ['income', 'refund'] : ['expense']

  const { data, error } = await fetchAppwriteDB('subCategories', [
    Query.select(['*', 'category.*', 'category.type.code']),
    Query.equal('category.type.code', ['undefined', ...types]),
    Query.orderAsc('category.type.code'),
    Query.orderAsc('description'),
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

const getAllSubCategories = async () => {
  const { data, error } = await fetchAppwriteDB('subCategories', [
    Query.select(['*', 'category.*', 'category.type.code'])
  ])


  if (error) {
    return {
      error: error,
      data: null,
    }
  } else {

    // Sort data by category description, then by description
    const sortedData = data.rows.sort((a: SubCategories, b: SubCategories) => {
      return a.category.description.localeCompare(b.category.description)
    })

    return {
      error: false,
      data: sortedData,
    }
  }
}

export default async function fetchSubCategories(transactionType?: 'income' | 'expense') {
  await requireAuth()

  let responseData = null

  if (transactionType) {
    const { data, error } = await getSubCategoriesByType(transactionType)
    if (error) {
      return {
        error: error,
        data: null,
      }
    }
    responseData = data
  } else {
    const { data, error } = await getAllSubCategories()
    if (error) {
      return {
        error: error,
        data: null,
      }
    }
    responseData = data
  }

  return {
    error: false,
    data: responseData,
  }
}