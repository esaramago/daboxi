import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import getEnableBankingToken from '@/utils/enablebanking/getToken'
import getEnableBankingAuthLink from '@/utils/enablebanking/getAuthLink'
import fetchEnableBankingSettings from '@/api/fetchEnableBankingSettings'
import { getAuthenticatedUser } from '@/lib/pocketbaseServer'

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: settings } = await fetchEnableBankingSettings()
    const bankName = settings?.bankName
    const country = settings?.country
    const isEnabled = settings?.enabled ?? false

    if (!isEnabled || !bankName || !country) {
      return NextResponse.redirect(
        new URL('/enablebanking/transactions?error=not_configured', request.url)
      )
    }

    const token = getEnableBankingToken()
    if (!token) {
      return NextResponse.redirect(
        new URL('/enablebanking/transactions?error=auth_link_failed', request.url)
      )
    }

    const state = crypto.randomBytes(32).toString('hex')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const redirectUrl = `${baseUrl}/enablebanking/callback`

    const authUrl = await getEnableBankingAuthLink(
      redirectUrl,
      token,
      bankName,
      country,
      state
    )

    if (!authUrl) {
      return NextResponse.redirect(
        new URL('/enablebanking/transactions?error=auth_link_failed', request.url)
      )
    }

    const response = NextResponse.redirect(authUrl)
    response.cookies.set('eb_auth_state', state, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 15 // 15 minutos
    })

    return response
  } catch (error) {
    console.error('[EnableBanking Auth] Error initiating auth flow:', error)
    return NextResponse.redirect(
      new URL('/enablebanking/transactions?error=auth_init_failed', request.url)
    )
  }
}

