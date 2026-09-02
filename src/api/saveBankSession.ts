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
    const pb = await getPocketBase()
    const payload = {
      ...data,
      user: userId,
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
