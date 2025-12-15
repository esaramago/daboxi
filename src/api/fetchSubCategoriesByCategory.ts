'use server'

import { fetchAppwriteDBWithSession, Query } from '@/lib/appwrite'
import { requireAuth, getSessionToken } from '@/lib/appwriteServer'
import { getCachedDataWithSession } from '@/lib/cache'

export default async function fetchSubCategoriesByCategory(categoryId: string) {
  await requireAuth()

  const cacheKey = `subCategories-by-category-${categoryId}`
  
  const response = await getCachedDataWithSession(
    cacheKey,
    async (sessionToken: string) => {
      const result = await fetchAppwriteDBWithSession(sessionToken, 'subCategories', [
        Query.select(['$id', 'icon', 'description', 'code', 'budget', 'category.type.code', 'category.type.description', 'category.code']),
        Query.equal('category.code', categoryId),
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
    },
    getSessionToken,
    ['subCategories', 'subCategories-by-category', cacheKey]
  )

  return response
}