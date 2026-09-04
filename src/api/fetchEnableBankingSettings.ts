'use server'

import { requireAuth, getAuthenticatedUser } from '@/lib/pocketbaseServer'
import { getPocketBase } from '@/lib/pocketbase'

export interface EnableBankingSettings {
  bankName: string | null
  country: string | null
  enabled: boolean
}

export default async function fetchEnableBankingSettings(): Promise<{
  error: any
  data: EnableBankingSettings | null
}> {
  await requireAuth()
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) {
    throw new Error('User not authenticated')
  }

  try {
    const pb = await getPocketBase()
    let dbUser = user
    try {
      dbUser = await pb.collection('users').getOne(user.id)
    } catch (dbErr) {
      console.warn('[EnableBanking] Could not fetch fresh user from DB, falling back to session:', dbErr)
    }

    const bankName = typeof dbUser.enablebanking_bank_name === 'string' && dbUser.enablebanking_bank_name.trim() !== ''
      ? dbUser.enablebanking_bank_name.trim()
      : null

    const country = typeof dbUser.enablebanking_country === 'string' && dbUser.enablebanking_country.trim() !== ''
      ? dbUser.enablebanking_country.trim()
      : null

    const enabled = typeof dbUser.enablebanking_enabled === 'boolean'
      ? dbUser.enablebanking_enabled
      : Boolean(bankName && country)

    return {
      error: null,
      data: {
        bankName,
        country,
        enabled,
      },
    }
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    console.error('[EnableBanking] Error fetching settings:', error)
    return {
      error: error?.message || error,
      data: null,
    }
  }
}
