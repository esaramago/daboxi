'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

import {
  sanitizeTransactionUpdate,
  type AllowedTransactionUpdates,
} from '@/utils/sanitizeTransaction'

export type { AllowedTransactionUpdates }

export default async function updateTransaction(
  id: string,
  data: AllowedTransactionUpdates | Record<string, any>
) {
  await requireAuth()

  if (!id || typeof id !== 'string' || !id.trim()) {
    return {
      error: 'ID de transação inválido',
      data: null,
    }
  }

  const cleanData = sanitizeTransactionUpdate(data)

  if (Object.keys(cleanData).length === 0) {
    return {
      error: 'Nenhum campo válido para atualização',
      data: null,
    }
  }

  try {
    const pb = await getPocketBase()
    const updated = await pb.collection('transactions').update(id.trim(), cleanData)
    return {
      error: null,
      data: formatRecord(updated)
    }
  } catch (error: any) {
    console.error('[updateTransaction] Error updating transaction:', error)
    return {
      error: error.message || error,
      data: null
    }
  }
}