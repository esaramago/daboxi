'use server'

import { requireAuth, getAuthenticatedUser } from '@/lib/pocketbaseServer'
import { getPocketBase } from '@/lib/pocketbase'
import { revalidatePath } from 'next/cache'

interface SaveEnableBankingSettingsParams {
  bankName: string
  country: string
}

export default async function saveEnableBankingSettings({
  bankName,
  country,
}: SaveEnableBankingSettingsParams) {
  try {
    await requireAuth()
    const { user, error } = await getAuthenticatedUser()
    if (error || !user) {
      throw new Error('User not authenticated')
    }

    const trimmedBankName = bankName?.trim()
    const trimmedCountry = country?.trim()

    if (!trimmedBankName || !trimmedCountry) {
      return {
        error: 'Nome do banco e país são obrigatórios',
        data: null,
      }
    }

    const pb = await getPocketBase()
    await pb.collection('users').update(user.id, {
      enablebanking_bank_name: trimmedBankName,
      enablebanking_country: trimmedCountry,
    })

    // Terminar todas as sessões ativas do EnableBanking para este utilizador
    const bankSessions = await pb.collection('bank_sessions').getFullList()
    for (const session of bankSessions) {
      await pb.collection('bank_sessions').delete(session.id).catch(() => {})
    }

    revalidatePath('/enablebanking/transactions')

    return {
      error: null,
      data: {
        bankName: trimmedBankName,
        country: trimmedCountry,
      },
    }
  } catch (error: any) {
    console.error('[EnableBanking] Error saving settings:', error)
    return {
      error: error?.message || error,
      data: null,
    }
  }
}
