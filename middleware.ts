import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PB_COOKIE_NAME } from '@/lib/config'

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
      // Ignora erro de decodificação e continua
    }
  }

  if (val.startsWith('{')) {
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed.token === 'string' && parsed.token.length > 0) {
        return parsed.token
      }
    } catch {
      // Ignora e tenta verificar se é token direto
    }
  }

  if (val.split('.').length === 3) {
    return val
  }

  return null
}

function isValidPocketBaseToken(token: string | null): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    const payloadStr = decodeBase64Url(parts[1])
    const payload = JSON.parse(payloadStr)

    if (typeof payload.exp !== 'number') {
      return false
    }

    const nowInSeconds = Math.floor(Date.now() / 1000)
    if (payload.exp <= nowInSeconds) {
      return false
    }

    if (!payload.id && !payload.userId && !payload.sub) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Bloqueia tentativas de acesso a ficheiros PHP ou caminhos ocultos comuns
  if (pathname.endsWith('.php') || pathname.startsWith('/.git')) {
    return new NextResponse(null, { status: 404 })
  }

  const authCookie = request.cookies.get(PB_COOKIE_NAME || 'pb_auth')
  const rawValue = authCookie?.value
  const token = rawValue ? parsePocketBaseToken(rawValue) : null
  const isAuthenticated = isValidPocketBaseToken(token)

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

// Configurar quais rotas o middleware deve executar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (manifest)
     * - static files with common extensions
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|css|js|woff|woff2|ttf|php)$).*)',
  ],
}
