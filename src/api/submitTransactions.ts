'use server'

import { createAppwriteRow } from '@/lib/appwrite'
import { requireAuth, getAuthenticatedUserId } from '@/lib/appwriteServer'
import { Permission, Role } from '@node_modules/appwrite'

export default async function submitTransactions(data) {
  await requireAuth()

  if (!data) return

  const userId = await getAuthenticatedUserId()
  
  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ]

  await createAppwriteRow('transactions', data, permissions)
}