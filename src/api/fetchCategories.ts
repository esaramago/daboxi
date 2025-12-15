'use server'

import { fetchAppwriteDBWithSession, Query } from '@/lib/appwrite'
import type { Types } from '@/appwrite.d'
import { requireAuth, getSessionToken } from '@/lib/appwriteServer'
import { getCachedDataWithSession } from '@/lib/cache'

const getAllCategories = async (sessionToken: string) => {

  const result = await fetchAppwriteDBWithSession(sessionToken, 'categories', [
    Query.select(['description', 'icon', 'code', 'type.code']),
    Query.notEqual('type', 'undefined'),
    Query.notEqual('type', 'refund'),
    Query.orderDesc('type'),
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

const getCategoriesByType = async (transactionType: Types['code'], sessionToken: string) => {

  const types = transactionType === 'income' ? ['income', 'refund'] : ['expense']

  const result = await fetchAppwriteDBWithSession(sessionToken, 'categories', [
    Query.select(['*', 'type.code']),
    Query.equal('type.code', ['undefined', ...types]),
    Query.orderAsc('type'),
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

export default async function fetchCategories(transactionType?: 'income' | 'expense') {
  await requireAuth()

  const cacheKey = `categories-${transactionType || 'all'}`
  
  const response = await getCachedDataWithSession(
    cacheKey,
    async (sessionToken: string) => {
      if (transactionType) {
        return await getCategoriesByType(transactionType, sessionToken)
      } else {
        return await getAllCategories(sessionToken)
      }
    },
    getSessionToken,
    ['categories', cacheKey]
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