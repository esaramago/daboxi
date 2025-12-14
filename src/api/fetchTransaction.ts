'use server'

import { getAppwriteRow, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'
import fetchTypes from './fetchTypes'
import type { Types } from '@/appwrite.d'

export default async function fetchTransaction(id: string) {
  await requireAuth()

  if (!id) return

  const { data, error } = await getAppwriteRow('transactions', id, [
    Query.select([
      '*',
      'subCategory.*',
      'subCategory.category.*'
    ]),
  ])

  if (error) {
    return {
      error: error,
      data: null,
    }
  }

  const { data: types, error: typesError } = await fetchTypes()
  if (typesError) {
    return {
      error: typesError,
      data: null,
    }
  }
  const type = types.find((type: Types) => type.$id === data.subCategory.category.type)
  
  data.subCategory.category.type = {
    code: type?.code,
    $id: type?.$id,
  }

  return {
    error: false,
    data: data,
  }
}