'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'

export default async function fetchSubCategory(code: string) {

  if (!code) return {
    error: 'Invalid code',
    data: null,
  }

  const result = await fetchAppwriteDB('subCategories', [
    Query.select(['*', 'category.*', 'category.type']),
    Query.equal('code', code)
  ])

  if (result.error) {
    return {
      error: result.error,
      data: null,
    }
  } else {
    return {
      error: false,
      data: result.data.rows[0],
    }
  }
}