'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'
import type { BankSessions } from '@/appwrite.d'

export default async function fetchActiveBankSession() {
  await requireAuth()

  const { data, error } = await fetchAppwriteDB('bank_sessions', [
    Query.orderDesc('$createdAt'),
    Query.limit(1)
  ])

  if (error || !data || !data.rows || data.rows.length === 0) {
    return {
      error: error || 'Nenhuma sessão encontrada',
      data: null
    }
  }

  const session = data.rows[0] as BankSessions

  // Verificar se o consentimento ainda é válido no tempo
  if (session.validUntil && new Date(session.validUntil).getTime() < Date.now()) {
    return {
      error: 'A sessão expirou',
      data: null
    }
  }

  return {
    error: null,
    data: session
  }
}

