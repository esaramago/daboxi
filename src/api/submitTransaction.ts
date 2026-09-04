'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth, getAuthenticatedUserId } from '@/lib/pocketbaseServer'

import { sanitizeTransactionUpdate } from '@/utils/sanitizeTransaction'

export default async function submitTransaction(data: any) {
  await requireAuth()
  const userId = await getAuthenticatedUserId()

  try {
    const pb = await getPocketBase()
    const enableBankingId =
      typeof data?.enableBankingId === 'string' && data.enableBankingId.trim() !== ''
        ? data.enableBankingId.trim()
        : null

    const payload: Record<string, any> = {
      ...sanitizeTransactionUpdate(data),
      user: userId,
    }

    if (enableBankingId) {
      payload.enableBankingId = enableBankingId
    }

    const record = await pb.collection('transactions').create(payload)

    if (enableBankingId) {
      await pb.collection('enablebanking_transactions').create({
        enableBankingId,
        status: 'imported',
        user: userId,
      }).catch(err => {
        console.error('[submitTransaction] Error saving to enablebanking_transactions:', err)
      })
    }

    return {
      error: null,
      data: formatRecord(record),
    }
  } catch (error: any) {
    console.error('[submitTransaction] Error creating transaction:', error)
    return {
      error: error.message || error,
      data: null,
    }
  }
}