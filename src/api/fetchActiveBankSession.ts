'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'
import type { BankSessions } from '@/types/pocketbase'

export default async function fetchActiveBankSession(bankName?: string | null) {
  await requireAuth()

  try {
    const pb = await getPocketBase()
    const filter = bankName ? pb.filter('bankName = {:bankName}', { bankName }) : ''

    const records = await pb.collection('bank_sessions').getList(1, 20, {
      filter,
      sort: '-id',
    })

    if (!records.items || records.items.length === 0) {
      return {
        error: 'Nenhuma sessão encontrada',
        data: null,
      }
    }

    const validSessions = (records.items as BankSessions[]).filter((bankSession) => {
      if (bankSession.status === 'EXPIRED' || bankSession.status === 'REVOKED') {
        return false
      }
      if (bankSession.validUntil && new Date(bankSession.validUntil).getTime() < Date.now()) {
        return false
      }
      if (bankName && bankSession.bankName && bankSession.bankName !== bankName) {
        return false
      }
      return true
    })

    if (validSessions.length === 0) {
      return {
        error: 'Nenhuma sessão ativa encontrada',
        data: null,
      }
    }

    // Prefer sessions with accounts already configured, otherwise pick the first valid session
    const session = validSessions.find((s) => Array.isArray(s.accounts) && s.accounts.length > 0) || validSessions[0]

    return {
      error: null,
      data: formatRecord<BankSessions>(session),
    }
  } catch (error: any) {
    return {
      error: error.message || error,
      data: null,
    }
  }
}
