'use server'

import fetchActiveBankSession from './fetchActiveBankSession'
import getEnableBankingToken from '@/utils/enablebanking/getToken'
import getEnableBankingTransactions from '@/utils/enablebanking/getTransactions'
import { requireAuth } from '@/lib/pocketbaseServer'

export default async function fetchEnableBankingTransaction(transactionId: string) {
  await requireAuth()

  if (!transactionId) {
    return {
      error: 'ID da transação não fornecido',
      data: null
    }
  }

  const session = await fetchActiveBankSession()
  if (session.error || !session.data?.sessionId) {
    return {
      error: session.error || 'Nenhuma sessão bancária ativa encontrada',
      data: null
    }
  }

  const token = getEnableBankingToken()
  const knownAccountId = session.data.accounts?.[0] || null
  const transactions = await getEnableBankingTransactions(session.data.sessionId, token, knownAccountId)

  if (!transactions || !Array.isArray(transactions)) {
    return {
      error: 'Não foi possível obter as transações do EnableBanking',
      data: null
    }
  }

  const transaction = transactions.find(
    (t: any) => t.transaction_id === transactionId || t.entry_reference === transactionId
  )

  if (!transaction) {
    return {
      error: 'Transação não encontrada no EnableBanking',
      data: null
    }
  }

  return {
    error: null,
    data: transaction
  }
}
