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
  }

  if (data.enableBankingId) {
    await createAppwriteRow('enablebanking_transactions', {
      enableBankingId: data.enableBankingId,
      status: 'imported'
    }, permissions).catch(err => {
      console.error('[submitTransaction] Error saving to enablebanking_transactions:', err)
    })
  }

  return {
    error: null,
    data: response
  }
}