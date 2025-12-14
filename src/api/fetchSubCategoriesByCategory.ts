'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function fetchSubCategoriesByCategory(categoryId: string) {
  await requireAuth()

  const { data, error } = await fetchAppwriteDB('subCategories', [
    Query.select(['$id', 'icon', 'description', 'code', 'budget', 'category.type.code', 'category.type.description', 'category.code']),
    Query.equal('category.code', categoryId),
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