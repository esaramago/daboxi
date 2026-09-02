'use server'

import { requireAuth, getAuthenticatedUser } from '@/lib/pocketbaseServer'

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
    const { user, error } = await getAuthenticatedUser()
    if (error || !user) {
      throw new Error('User not authenticated')
    }

    const bankName = typeof user.enablebanking_bank_name === 'string' && user.enablebanking_bank_name.trim() !== ''
      ? user.enablebanking_bank_name.trim()
      : null

    const country = typeof user.enablebanking_country === 'string' && user.enablebanking_country.trim() !== ''
      ? user.enablebanking_country.trim()
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
