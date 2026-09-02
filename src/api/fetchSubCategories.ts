'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import type { SubCategories, Types } from '@/types/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

const getSubCategoriesByType = async (transactionType: Types['code']) => {
  try {
    const pb = await getPocketBase()
    const types = transactionType === 'income' ? ['income', 'refund', 'undefined'] : ['expense', 'undefined']
    const filterConditions = types.map(t => `category.type.code = "${t}"`).join(' || ')

    const records = await pb.collection('subcategories').getFullList({
      expand: 'category.type',
      filter: filterConditions,
      sort: 'category.type.code,description',
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

const getAllSubCategories = async () => {
  try {
    const pb = await getPocketBase()
    const records = await pb.collection('subcategories').getFullList({
      expand: 'category.type',
    })

    const formatted = records.map(r => formatRecord<SubCategories>(r))
    
    // Sort data by category description, then by description
    const sortedData = formatted.sort((a, b) => {
      const descA = a.category?.description || ''
      const descB = b.category?.description || ''
      return descA.localeCompare(descB)
    })

    return {
      error: false,
      data: sortedData,
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null,
    }
  }
}

export default async function fetchSubCategories(transactionType?: 'income' | 'expense') {
  await requireAuth()

  if (transactionType) {
    return await getSubCategoriesByType(transactionType)
  } else {
    return await getAllSubCategories()
  }
}