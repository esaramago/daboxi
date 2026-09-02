'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import type { SubCategories } from '@/types/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export default async function fetchSubCategories(categoryType: string) {
  await requireAuth()

  try {
    const pb = await getPocketBase()
    const records = await pb.collection('subcategories').getFullList({
      expand: 'category.type',
      filter: `category.type.code = "${categoryType}"`,
      sort: 'description',
    })

    return {
      error: false,
      data: records.map(r => formatRecord<SubCategories>(r)),
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null,
    }
  }
}