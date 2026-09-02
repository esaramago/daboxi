'use server'

import { updateAppwriteRow } from '@/lib/appwrite'
import { requireAuth, getAuthenticatedUserId } from '@/lib/appwriteServer'
import { Permission, Role } from '@node_modules/appwrite'

export default async function updateTransaction(id: string, data: object) {
  await requireAuth()
  const userId = await getAuthenticatedUserId()

  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ]

  await updateAppwriteRow('transactions', id, data, permissions)
}