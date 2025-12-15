'use server'

import { fetchAppwriteDBPublic, Query } from '@/lib/appwrite'
import { getCachedData } from '@/lib/cache'

export default async function fetchTypes() {

  const response = await getCachedData(
    'types-all',
    async () => {
      const result = await fetchAppwriteDBPublic('types', [
        Query.select(['*']),
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
    ['types', 'types-all']
  )

  return response
}