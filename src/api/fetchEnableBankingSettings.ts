'use server'

import { requireAuth, getAuthenticatedClient } from '@/lib/appwriteServer'
import { Account } from '@node_modules/appwrite'

export interface EnableBankingSettings {
  bankName: string | null
  country: string | null
}

export default async function fetchEnableBankingSettings(): Promise<{
  error: any
  data: EnableBankingSettings | null
}> {
  try {
    await requireAuth()
    const client = await getAuthenticatedClient()
    const account = new Account(client)
    const user = await account.get()
    const prefs = (user.prefs || {}) as Record<string, any>

    const bankName = typeof prefs.enablebanking_bank_name === 'string' && prefs.enablebanking_bank_name.trim() !== ''
      ? prefs.enablebanking_bank_name.trim()
      : null

    const country = typeof prefs.enablebanking_country === 'string' && prefs.enablebanking_country.trim() !== ''
      ? prefs.enablebanking_country.trim()
      : null

    return {
      error: null,
      data: {
        bankName,
        country,
      },
    }
  } catch (error: any) {
    console.error('[EnableBanking] Error fetching settings:', error)
    return {
      error: error?.message || error,
      data: null,
    }
  }
}
