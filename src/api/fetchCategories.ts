'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import type { Types, Categories } from '@/types/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

const getAllCategories = async () => {
  try {
    const pb = await getPocketBase()
    const records = await pb.collection('categories').getFullList({
      expand: 'type',
      filter: 'type.code != "undefined" && type.code != "refund"',
      sort: '-type,description',
    })
    return {
      error: false,
      data: records.map(r => formatRecord<Categories>(r)),
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null,
    }
  }
}

const getCategoriesByType = async (transactionType: Types['code']) => {
  try {
    const pb = await getPocketBase()
    const types = transactionType === 'income' ? ['income', 'refund', 'undefined'] : ['expense', 'undefined']
    const filterConditions = types.map(t => `type.code = "${t}"`).join(' || ')
    
    const records = await pb.collection('categories').getFullList({
      expand: 'type',
      filter: filterConditions,
      sort: 'type,description',
    })
    return {
      error: false,
      data: records.map(r => formatRecord<Categories>(r)),
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null,
    }
  }
}

export default async function fetchCategories(transactionType?: 'income' | 'expense') {
  await requireAuth()

  if (transactionType) {
    return await getCategoriesByType(transactionType)
  } else {
    return await getAllCategories()
  }
}