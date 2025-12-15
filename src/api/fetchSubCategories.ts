'use server'

import { fetchAppwriteDBWithSession, Query } from '@/lib/appwrite'
import type { SubCategories, Types } from '@/appwrite.d'
import { requireAuth, getSessionToken } from '@/lib/appwriteServer'
import { getCachedDataWithSession } from '@/lib/cache'

const getSubCategoriesByType = async (transactionType: Types['code'], sessionToken: string) => {

  const types = transactionType === 'income' ? ['income', 'refund'] : ['expense']

  const result = await fetchAppwriteDBWithSession(sessionToken, 'subCategories', [
    Query.select(['*', 'category.*', 'category.type.code']),
    Query.equal('category.type.code', ['undefined', ...types]),
    Query.orderAsc('category.type.code'),
    Query.orderAsc('description'),
  ])

  if (result.error) {
    return {
      error: result.error,
      data: null,
    }
  } else {
    return {
      error: false,
      data: result.data.rows,
    }
  }
}

const getAllSubCategories = async (sessionToken: string) => {
  const result = await fetchAppwriteDBWithSession(sessionToken, 'subCategories', [
    Query.select(['*', 'category.*', 'category.type.code'])
  ])

  if (result.error) {
    return {
      error: result.error,
      data: null,
    }
  } else {

    // Sort data by category description, then by description
    const sortedData = result.data.rows.sort((a: SubCategories, b: SubCategories) => {
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

  const cacheKey = `subCategories-${transactionType || 'all'}`
  
  const response = await getCachedDataWithSession(
    cacheKey,
    async (sessionToken: string) => {
      if (transactionType) {
        return await getSubCategoriesByType(transactionType, sessionToken)
      } else {
        return await getAllSubCategories(sessionToken)
      }
    },
    getSessionToken,
    ['subCategories', cacheKey]
  )

  if (response.error) {
    return {
      error: response.error,
      data: null,
    }
  } else {
    return {
      error: false,
      data: response.data,
    }
  }
}