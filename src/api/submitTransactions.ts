'use server'

import { createAppwriteRow } from '@/lib/appwrite'
import { requireAuth, getAuthenticatedUserId } from '@/lib/appwriteServer'
import { Permission, Role } from '@node_modules/appwrite'
import type { Transactions } from '@/appwrite.d'

export default async function submitTransactions(data: Array<Transactions>) {
  await requireAuth()

  if (!data) return

  const userId = await getAuthenticatedUserId()
  
  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ]

  const results = []
  for (const transaction of data) {
    const { data: newTransaction, error: newTransactionError } = await createAppwriteRow('transactions', transaction, permissions)
    results.push({
      data: newTransaction,
      error: newTransactionError
    })
  }

  return results
}