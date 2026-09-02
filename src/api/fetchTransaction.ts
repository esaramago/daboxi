'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'
import type { Transactions } from '@/types/pocketbase'

export default async function fetchTransaction(id: string) {
  await requireAuth()

  if (!id) return { error: 'No ID provided', data: null }

  try {
    const pb = await getPocketBase()
    const record = await pb.collection('transactions').getOne(id, {
      expand: 'subCategory.category.type',
    })

    return {
      error: false,
      data: formatRecord<Transactions>(record),
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null,
    }
  }
}