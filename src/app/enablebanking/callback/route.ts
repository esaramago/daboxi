import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import createEnableBankingSession from '@/utils/enablebanking/createSession'
import getEnableBankingToken from '@/utils/enablebanking/getToken'
import fetchEnableBankingSettings from '@/api/fetchEnableBankingSettings'
import saveBankSession from '@/api/saveBankSession'
import { getAuthenticatedUser } from '@/lib/pocketbaseServer'

function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function GET(request: NextRequest) {
  function redirectWithClearedState(url: URL) {
    const res = NextResponse.redirect(url)
    res.cookies.delete('eb_auth_state')
    return res
  }

  try {
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const error = request.nextUrl.searchParams.get('error')
    const storedState = request.cookies.get('eb_auth_state')?.value

    if (error) {
      console.error('[EnableBanking Callback] Error returned from bank:', error)
      return redirectWithClearedState(
        new URL(`/enablebanking/transactions?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    // 1. Validação estrita do token CSRF state
    if (!state || !storedState || !safeCompare(state, storedState)) {
      console.error('[EnableBanking Callback] Invalid or missing CSRF state token')
      return redirectWithClearedState(
        new URL('/enablebanking/transactions?error=invalid_state', request.url)
      )
    }

    // 2. Validação da existência do código de autorização
    if (!code) {
      return redirectWithClearedState(
        new URL('/enablebanking/transactions?error=missing_code', request.url)
      )
    }

    // 3. Obter configurações do utilizador
    const { data: settings } = await fetchEnableBankingSettings()
    const bankName = settings?.bankName
    const country = settings?.country

    if (!bankName || !country) {
      return redirectWithClearedState(
        new URL('/enablebanking/transactions?error=not_configured', request.url)
      )
    }

    // 4. Trocar código por sessão na EnableBanking
    const token = getEnableBankingToken()
    const sessionId = await createEnableBankingSession(code, token)

    if (!sessionId) {
      return redirectWithClearedState(
        new URL('/enablebanking/transactions?error=session_creation_failed', request.url)
      )
    }

    // 5. Guardar sessão autorizada
    await saveBankSession({
      sessionId,
      bankName,
      country,
      status: 'AUTHORIZED',
    })

    return redirectWithClearedState(new URL('/enablebanking/transactions', request.url))
  } catch (error) {
    console.error('[EnableBanking Callback] Exception handling callback:', error)
    return redirectWithClearedState(
      new URL('/enablebanking/transactions?error=callback_exception', request.url)
    )
  }
}

