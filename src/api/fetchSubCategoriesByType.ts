'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function fetchSubCategories(categoryType: string) {
  await requireAuth()

  const { data, error } = await fetchAppwriteDB('subCategories', [
    Query.select(['*', 'category.*', 'category.type.code']),
    Query.equal('category.type.code', categoryType),
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