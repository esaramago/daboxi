'use server'

import { createAppwriteRow } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function submitTransaction(data) {
  await requireAuth()
  
  const { data: response, error } = await createAppwriteRow('transactions', data)

  if (error) {
    return {
      error,
      data: null
    }
  } else {
    return {
      error: null,
      data: response
    }
  }
}