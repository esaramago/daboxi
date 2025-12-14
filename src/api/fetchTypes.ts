'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'

export default async function fetchTypes() {

  const { data, error } = await fetchAppwriteDB('types', [
    Query.select(['*']),
  ])

  if (error) {
    return {
      error: error,
      data: null,
    }
  } else {
    return {
      error: false,
      data: data.rows,
    }
  }
}