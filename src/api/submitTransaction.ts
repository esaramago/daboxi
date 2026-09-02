'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth, getAuthenticatedUserId } from '@/lib/pocketbaseServer'

export default async function submitTransaction(data: any) {
  await requireAuth()
  const userId = await getAuthenticatedUserId()

  try {
    const pb = await getPocketBase()
    const payload = {
      ...data,
      user: userId,
    }

    const record = await pb.collection('transactions').create(payload)

    if (data.enableBankingId) {
      await pb.collection('enablebanking_transactions').create({
        enableBankingId: data.enableBankingId,
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