'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth, getAuthenticatedUserId } from '@/lib/pocketbaseServer'

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

  try {
    if (!data.accounts || data.accounts.length === 0) {
      return {
        error: 'A conta não é autorizada',
        data: null,
      }
    }

    const pb = await getPocketBase()
    const payload = {
      ...data,
      user: userId,
    }

    if (data.bankName) {
      try {
        const oldSessions = await pb.collection('bank_sessions').getList(1, 50, {
          filter: pb.filter('bankName = {:bankName} && status != "EXPIRED"', { bankName: data.bankName }),
        })
        for (const old of oldSessions.items) {
          await pb.collection('bank_sessions').update(old.id, { status: 'EXPIRED' }).catch(() => {})
        }
      } catch (err) {
        console.warn('[saveBankSession] Error expiring older sessions:', err)
      }
    }

    const response = await pb.collection('bank_sessions').create(payload)

    return {
      error: null,
      data: formatRecord(response),
    }
  } catch (error: any) {
    console.error('[saveBankSession] Error saving bank session:', error)
    return {
      error: error.message || error,
      data: null,
    }
  }
}
