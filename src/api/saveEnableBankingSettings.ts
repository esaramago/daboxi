'use server'

import { requireAuth, getAuthenticatedClient } from '@/lib/appwriteServer'
import { Account } from '@node_modules/appwrite'
import { fetchAppwriteDB, deleteAppwriteRow } from '@/lib/appwrite'
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

    const trimmedBankName = bankName?.trim()
    const trimmedCountry = country?.trim()

    if (!trimmedBankName || !trimmedCountry) {
      return {
        error: 'Nome do banco e país são obrigatórios',
        data: null,
      }
    }

    const client = await getAuthenticatedClient()
    const account = new Account(client)
    const currentPrefs = await account.getPrefs()

    await account.updatePrefs({
      ...currentPrefs,
      enablebanking_bank_name: trimmedBankName,
      enablebanking_country: trimmedCountry,
    })

    // Terminar todas as sessões ativas do EnableBanking para este utilizador
    const { data: bankSessions } = await fetchAppwriteDB('bank_sessions')
    if (bankSessions && bankSessions.rows && bankSessions.rows.length > 0) {
      for (const session of bankSessions.rows) {
        await deleteAppwriteRow('bank_sessions', session.$id)
      }
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

