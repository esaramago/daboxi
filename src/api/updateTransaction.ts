'use server'

import { updateAppwriteRow } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function updateTransaction(id: string, data: object) {
  await requireAuth()
  await updateAppwriteRow('transactions', id, data)
}