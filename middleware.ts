import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log(`[Middleware] Request: ${request.method} ${request.nextUrl.pathname}`)
  // O layout.tsx já gerencia a autenticação no cliente
  // As server actions também estão protegidas
  // Este middleware pode ser usado para proteção adicional se necessário
  // Por enquanto, deixamos passar - a proteção está no layout.tsx e nas server actions
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
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|php)$).*)',
  ],
}
