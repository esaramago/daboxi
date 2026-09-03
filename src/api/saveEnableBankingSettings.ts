'use server'

import { requireAuth, getAuthenticatedUser } from '@/lib/pocketbaseServer'
import { getPocketBase } from '@/lib/pocketbase'
import { PB_COOKIE_NAME } from '@/lib/config'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

interface SaveEnableBankingSettingsParams {
  bankName?: string
  country?: string
  enabled?: boolean
}

export default async function saveEnableBankingSettings({
  bankName,
  country,
  enabled = true,
}: SaveEnableBankingSettingsParams) {
  try {
    await requireAuth()
    const { user, error } = await getAuthenticatedUser()
    if (error || !user) {
      throw new Error('User not authenticated')
    }

    const trimmedBankName = bankName?.trim() || ''
    const trimmedCountry = country?.trim().toUpperCase() || ''

    if (enabled) {
      if (!trimmedBankName || !trimmedCountry) {
        return {
          error: 'Nome do banco e país são obrigatórios',
          data: null,
        }
      }

      if (!/^[a-zA-Z0-9]+$/.test(trimmedBankName)) {
        return {
          error: 'O nome do banco não pode ter espaços nem caracteres especiais',
          data: null,
        }
      }

      if (!/^[A-Z]{2}$/.test(trimmedCountry)) {
        return {
          error: 'O código do país só pode ter 2 letras',
          data: null,
        }
      }
    }

    const pb = await getPocketBase()
    const updateData: Record<string, any> = {
      enablebanking_enabled: enabled,
    }

    if (trimmedBankName) {
      updateData.enablebanking_bank_name = trimmedBankName
    }
    if (trimmedCountry) {
      updateData.enablebanking_country = trimmedCountry
    }

    const updatedUser = await pb.collection('users').update(user.id, updateData)

    // Sincronizar authStore e o cookie da sessão
    pb.authStore.save(pb.authStore.token, updatedUser)
    try {
      const cookieStore = await cookies()
      const cookieHeader = pb.authStore.exportToCookie({
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
      const match = cookieHeader.match(new RegExp(`${PB_COOKIE_NAME}=([^;]+)`))
      const cookieValue = match ? match[1] : pb.authStore.exportToCookie()

      cookieStore.set(PB_COOKIE_NAME, cookieValue, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30
      })
    } catch (cookieErr) {
      console.warn('[EnableBanking] Warning syncing session cookie:', cookieErr)
    }

    // Terminar todas as sessões ativas do EnableBanking para este utilizador
    const bankSessions = await pb.collection('bank_sessions').getFullList()
    for (const session of bankSessions) {
      await pb.collection('bank_sessions').delete(session.id).catch(() => {})
    }

    revalidatePath('/enablebanking/transactions')

    return {
      error: null,
      data: {
        enabled,
        bankName: updatedUser.enablebanking_bank_name || null,
        country: updatedUser.enablebanking_country || null,
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
