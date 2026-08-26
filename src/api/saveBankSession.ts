'use server'

import { createAppwriteRow } from '@/lib/appwrite'
import { requireAuth, getAuthenticatedUserId } from '@/lib/appwriteServer'
import { Permission, Role } from '@node_modules/appwrite'

interface SaveBankSessionParams {
  sessionId: string
  bankName?: string
  country?: string
  accounts?: string[]
  validUntil?: string
  status?: string
}

export default async function saveBankSession(data: SaveBankSessionParams) {
  await requireAuth()
  const userId = await getAuthenticatedUserId()

  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ]

  const { data: response, error } = await createAppwriteRow('bank_sessions', data, permissions)

  if (error) {
    return {
      error,
      data: null
    }
  }

  return {
    error: null,
    data: response
  }
}

