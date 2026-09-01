'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'
import type { BankSessions } from '@/appwrite.d'

export default async function fetchActiveBankSession(bankName?: string | null) {
  await requireAuth()

  const queries = [
    Query.orderDesc('$createdAt'),
    Query.limit(10)
  ]

  if (bankName) {
    queries.push(Query.equal('bankName', bankName))
  }

  const { data, error } = await fetchAppwriteDB('bank_sessions', queries)

  if (error || !data || !data.rows || data.rows.length === 0) {
    return {
      error: error || 'Nenhuma sessão encontrada',
      data: null
    }
  }

  // Encontra a sessão mais recente válida
  const session = data.rows.find((s: any) => {
    const bankSession = s as BankSessions
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
  }) as BankSessions | undefined

  if (!session) {
    return {
      error: 'Nenhuma sessão ativa encontrada',
      data: null
    }
  }

  return {
    error: null,
    data: session
  }
}
