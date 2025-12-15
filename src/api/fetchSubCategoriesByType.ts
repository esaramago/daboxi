'use server'

import { fetchAppwriteDBWithSession, Query } from '@/lib/appwrite'
import { requireAuth, getSessionToken } from '@/lib/appwriteServer'
import { getCachedDataWithSession } from '@/lib/cache'

export default async function fetchSubCategories(categoryType: string) {
  await requireAuth()

  const cacheKey = `subCategories-by-type-${categoryType}`
  
  const response = await getCachedDataWithSession(
    cacheKey,
    async (sessionToken: string) => {
      const result = await fetchAppwriteDBWithSession(sessionToken, 'subCategories', [
        Query.select(['*', 'category.*', 'category.type.code']),
        Query.equal('category.type.code', categoryType),
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
    ['subCategories', 'subCategories-by-type', cacheKey]
  )

  return response
}