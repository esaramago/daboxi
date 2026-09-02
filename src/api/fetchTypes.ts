'use server'

import { getPublicPocketBase, formatRecord } from '@/lib/pocketbase'
import { getCachedData } from '@/lib/cache'
import type { Types } from '@/types/pocketbase'

export default async function fetchTypes() {
  const response = await getCachedData(
    'types-all',
    async () => {
      try {
        const pb = getPublicPocketBase()
        const records = await pb.collection('types').getFullList()
        return {
          error: false,
          data: records.map(r => formatRecord<Types>(r))
        }
      } catch (error: any) {
        return {
          error: error.message || error,
          data: null
        }
      }
    },
    ['types', 'types-all']
  )

  return response
}