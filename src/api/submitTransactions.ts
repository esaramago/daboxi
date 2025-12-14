'use server'

import { createAppwriteRow } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function submitTransactions(data) {
  await requireAuth()

  if (!data) return

  await createAppwriteRow('transactions', data)
}