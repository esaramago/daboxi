'use server'

import { getPocketBase, formatRecord } from '@/lib/pocketbase'
import { requireAuth } from '@/lib/pocketbaseServer'

export interface AllowedTransactionUpdates {
  date?: string | Date | null
  value?: number
  netValue?: number | null
  niceDescription?: string
  description?: string | null
  notes?: string | null
  subCategory?: string | null
  refundsIds?: string | null
}

export function sanitizeTransactionUpdate(data: any): AllowedTransactionUpdates {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const sanitized: AllowedTransactionUpdates = {}

  if ('date' in data) {
    if (data.date instanceof Date) {
      sanitized.date = data.date
    } else if (typeof data.date === 'string') {
      const trimmed = data.date.trim()
      sanitized.date = trimmed ? trimmed : null
    } else if (data.date === null) {
      sanitized.date = null
    }
  }

  if ('value' in data && data.value !== null && data.value !== undefined) {
    const num = Number(data.value)
    if (!isNaN(num) && isFinite(num)) {
      sanitized.value = num
    }
  }

  if ('netValue' in data) {
    if (data.netValue === null || data.netValue === '') {
      sanitized.netValue = null
    } else {
      const num = Number(data.netValue)
      if (!isNaN(num) && isFinite(num)) {
        sanitized.netValue = num
      }
    }
  }

  if ('niceDescription' in data && typeof data.niceDescription === 'string') {
    const trimmed = data.niceDescription.trim()
    if (trimmed) {
      sanitized.niceDescription = trimmed
    }
  }

  if ('description' in data) {
    if (typeof data.description === 'string') {
      sanitized.description = data.description.trim()
    } else if (data.description === null) {
      sanitized.description = null
    }
  }

  if ('notes' in data) {
    if (typeof data.notes === 'string') {
      sanitized.notes = data.notes.trim()
    } else if (data.notes === null) {
      sanitized.notes = null
    }
  }

  if ('subCategory' in data) {
    if (typeof data.subCategory === 'string') {
      sanitized.subCategory = data.subCategory.trim()
    } else if (data.subCategory === null) {
      sanitized.subCategory = null
    }
  }

  if ('refundsIds' in data) {
    if (typeof data.refundsIds === 'string') {
      sanitized.refundsIds = data.refundsIds.trim()
    } else if (data.refundsIds === null) {
      sanitized.refundsIds = null
    }
  }

  return sanitized
}

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