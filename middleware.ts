import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PB_COOKIE_NAME, POCKETBASE_URL } from '@/lib/config'

// Cache verified token validity for up to 60 seconds to avoid repetitive backend calls on fast navigations
const verifiedTokensCache = new Map<string, number>()
const VERIFIED_TOKEN_TTL_MS = 60 * 1000

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  try {
    return atob(base64)
  } catch {
    return Buffer.from(base64, 'base64').toString('utf-8')
  }
}

function parsePocketBaseToken(cookieValue: string): string | null {
  let val = cookieValue.trim()
  if (!val) return null

  if (val.includes('%')) {
    try {
      val = decodeURIComponent(val)
    } catch {
      // Ignore URI decode errors and proceed
    }
  }

  if (val.startsWith('{')) {
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed.token === 'string' && parsed.token.length > 0) {
        return parsed.token
      }
    } catch {
      // Ignore JSON parse errors and continue
    }
  }

  if (val.split('.').length === 3) {
    return val
  }

  return null
}

async function isValidPocketBaseToken(token: string | null): Promise<boolean> {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const nowInSeconds = Math.floor(Date.now() / 1000)

  // 1. Fast preliminary check: decode and inspect payload structure and expiration
  try {
    const payloadStr = decodeBase64Url(parts[1])
    const payload = JSON.parse(payloadStr)

    if (typeof payload.exp !== 'number' || payload.exp <= nowInSeconds) {
      return false
    }

    if (!payload.id && !payload.userId && !payload.sub) {
      return false
    }
  } catch {
    return false
  }

  // 2. Check in-memory verification cache
  const cachedExp = verifiedTokensCache.get(token)
  if (cachedExp && Date.now() < cachedExp) {
    return true
  }

  // 3. Cryptographically verify signature and active session with PocketBase
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      verifiedTokensCache.delete(token)
      return false
    }

    // Cache valid verification to minimize backend calls
    if (verifiedTokensCache.size > 500) {
      const now = Date.now()
      for (const [key, exp] of verifiedTokensCache.entries()) {
        if (now >= exp) verifiedTokensCache.delete(key)
      }
    }
    verifiedTokensCache.set(token, Date.now() + VERIFIED_TOKEN_TTL_MS)

    return true
  } catch (error) {
    console.error('[Middleware] Failed to verify token with PocketBase:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Block access to PHP files or hidden paths
  if (pathname.endsWith('.php') || pathname.startsWith('/.git')) {
    return new NextResponse(null, { status: 404 })
  }

  const authCookie = request.cookies.get(PB_COOKIE_NAME || 'pb_auth')
  const rawValue = authCookie?.value
  const token = rawValue ? parsePocketBaseToken(rawValue) : null
  const isAuthenticated = await isValidPocketBaseToken(token)

  const isAuthRoute = pathname === '/login' || pathname === '/forgot-password'

  if (isAuthRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    if (rawValue) {
      response.cookies.delete(PB_COOKIE_NAME || 'pb_auth')
    }
    return response
  }

  return NextResponse.next()
}

// Configure matched routes for middleware execution
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (manifest)
     * - static files with common extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|css|js|woff|woff2|ttf|php)$).*)',
  ],
}
