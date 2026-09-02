'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import type { SubCategories } from '@/types/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export default async function fetchSubCategory(code: string) {
  await requireAuth()

  if (!code) {
    return {
      error: 'Invalid code',
      data: null,
    }
  }

  try {
    const pb = await getPocketBase()
    const record = await pb.collection('subcategories').getFirstListItem(`code = "${code}"`, {
      expand: 'category.type',
    })

    return {
      error: false,
      data: formatRecord<SubCategories>(record),
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null,
    }
  }
}