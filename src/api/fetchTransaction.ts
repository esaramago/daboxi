'use server'

import { getAppwriteRow, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'
import fetchTypes from './fetchTypes'
import type { Types } from '@/appwrite.d'
import getSubCategory from './fetchSubCategory'

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

  if (!data.subCategory || !data.subCategory.category) {
    // prevent error if subcategory is undefined
    const undefinedType = types.find((type: Types) => type.code === 'undefined')
    const undefinedSubCategory = await getSubCategory('undefined')
    data.subCategory = undefinedSubCategory.data
    data.subCategory.category.type = {
      code: undefinedType?.code,
      $id: undefinedType?.$id,
    }
  } else {
    const type = types.find((type: Types) => type.$id === data.subCategory?.category?.type)
    data.subCategory.category.type = {
      code: type?.code,
      $id: type?.$id,
    }
  }

  return {
    error: false,
    data: data,
  }
}