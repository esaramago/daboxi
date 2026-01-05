import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// #region agent log
const logDebug = (message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7244/ingest/ce944489-1881-48c4-a9b6-0cd49044fa2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'middleware.ts',
        message,
        data,
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      })
    }).catch(() => {})
  } catch {}
}
// #endregion agent log

export function middleware(request: NextRequest) {
  // #region agent log
  const isServerAction = request.nextUrl.pathname.includes('/_next/server-actions') || request.nextUrl.pathname.includes('/actions/')
  const buildId = request.headers.get('x-nextjs-build-id') || request.nextUrl.searchParams.get('_rsc') || 'unknown'
  logDebug('middleware request', {
    path: request.nextUrl.pathname,
    isServerAction,
    buildId,
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    referer: request.headers.get('referer')?.substring(0, 100)
  })
  // #endregion agent log
  
  // O layout.tsx já gerencia a autenticação no cliente
  // As server actions também estão protegidas
  // Este middleware pode ser usado para proteção adicional se necessário
  // Por enquanto, deixamos passar - a proteção está no layout.tsx e nas server actions
  const response = NextResponse.next()
  
  // #region agent log
  // Add cache control headers for Server Actions
  if (isServerAction) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    logDebug('middleware added cache headers for server action', { path: request.nextUrl.pathname })
  }
  // #endregion agent log
  
  return response
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
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
