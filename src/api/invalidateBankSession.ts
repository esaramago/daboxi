'use server'

import { getPocketBase } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export default async function invalidateBankSession(sessionId: string) {
  await requireAuth()

  if (!sessionId) return { error: 'No sessionId provided', data: null }

  try {
    const pb = await getPocketBase()
    const records = await pb.collection('bank_sessions').getList(1, 10, {
      filter: pb.filter('sessionId = {:sessionId}', { sessionId }),
    })

    for (const record of records.items) {
      await pb.collection('bank_sessions').update(record.id, {
        status: 'EXPIRED',
      })
    }

    return { error: null, data: true }
  } catch (error: any) {
    console.error('[invalidateBankSession] Error:', error)
    return { error: error.message || error, data: null }
  }
}
