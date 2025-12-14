'use server'

import { deleteAppwriteRow } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function deleteTransaction(id: string) {
  await requireAuth()

  if (!id) return

  await deleteAppwriteRow('transactions', id)
}