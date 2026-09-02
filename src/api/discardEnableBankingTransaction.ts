'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth, getAuthenticatedUserId } from '@/lib/pocketbaseServer'

export default async function discardEnableBankingTransaction(enableBankingId: string) {
  await requireAuth()
  const userId = await getAuthenticatedUserId()

  if (!enableBankingId) {
    return {
      error: 'ID da transação não fornecido',
      data: null,
    }
  }

  try {
    const pb = await getPocketBase()
    const response = await pb.collection('enablebanking_transactions').create({
      enableBankingId,
      status: 'discarded',
      user: userId,
    })

    return {
      error: null,
      data: formatRecord(response),
    }
  } catch (error: any) {
    console.error('[discardEnableBankingTransaction] Error:', error)
    return {
      error: error.message || error,
      data: null,
    }
  }
}
