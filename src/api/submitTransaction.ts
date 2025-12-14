'use server'

import { createAppwriteRow } from '@/lib/appwrite'
import { requireAuth, getAuthenticatedUserId } from '@/lib/appwriteServer'
import { Permission, Role } from '@node_modules/appwrite'

export default async function submitTransaction(data) {
  await requireAuth()
  const userId = await getAuthenticatedUserId()
  
  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ]
  
  const { data: response, error } = await createAppwriteRow('transactions', data, permissions)

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