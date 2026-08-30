'use server'

import { fetchAppwriteDB, Query } from '@/lib/appwrite'
import { requireAuth } from '@/lib/appwriteServer'

export default async function fetchExistingEnableBankingIds() {
  await requireAuth()

  const { data, error } = await fetchAppwriteDB('transactions', [
    Query.select(['$id', 'enableBankingId']),
  ], 5000)

  if (error || !data) {
    return {
      error: error || 'Não foi possível obter os identificadores EnableBanking existentes',
      data: []
    }
  }

  const ids: string[] = data.rows
    .map((row: any) => row.enableBankingId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  return {
    error: null,
    data: ids
  }
}

