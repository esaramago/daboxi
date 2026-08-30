'use server'

import { createAppwriteRow } from '@/lib/appwrite'
import { requireAuth, getAuthenticatedUserId } from '@/lib/appwriteServer'
import { Permission, Role } from '@node_modules/appwrite'

export default async function discardEnableBankingTransaction(enableBankingId: string) {
  await requireAuth()
  const userId = await getAuthenticatedUserId()

  if (!enableBankingId) {
    return {
      error: 'ID da transação não fornecido',
      data: null,
    }
  }

  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]

  const { data: response, error } = await createAppwriteRow(
    'enablebanking_transactions',
    {
      enableBankingId,
      status: 'discarded',
    },
    permissions
  )

  if (error) {
    return {
      error,
      data: null,
    }
  }

  return {
    error: null,
    data: response,
  }
}

