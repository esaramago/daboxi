'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import type { Types } from '@/appwrite.d'
import { requireAuth } from '@/lib/appwriteServer'

const getAllCategories = async () => {

  const { data, error } = await fetchAppwriteDB('categories', [
    Query.select(['description', 'icon', 'code', 'type.code']),
    Query.notEqual('type', 'undefined'),
    Query.notEqual('type', 'refund'),
    Query.orderDesc('type'),
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

const getCategoriesByType = async (transactionType: Types['code']) => {

  const types = transactionType === 'income' ? ['income', 'refund'] : ['expense']

  const { data, error } = await fetchAppwriteDB('categories', [
    Query.select(['*', 'type.code']),
    Query.equal('type.code', ['undefined', ...types]),
    Query.orderAsc('type'),
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

export default async function fetchCategories(transactionType?: 'income' | 'expense') {
  await requireAuth()

  let response = null

  if (transactionType) {
    response = await getCategoriesByType(transactionType)
  } else {
    response = await getAllCategories()
  }

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