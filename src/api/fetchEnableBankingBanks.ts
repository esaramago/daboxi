'use server'

import getEnableBankingAspsps, { type EnableBankingAspsp } from '@/utils/enablebanking/getAspsps'

export default async function fetchEnableBankingBanks(country?: string): Promise<{
  data: EnableBankingAspsp[]
  error: string | null
}> {
  try {
    const aspsps = await getEnableBankingAspsps(country)
    return { data: aspsps, error: null }
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    console.error('[EnableBanking] Error fetching banks:', error)
    return { data: [], error: error?.message || 'Erro ao carregar lista de bancos' }
  }
}

