import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  
  const pathname = request.nextUrl.pathname;

  // Bloqueia tentativas de acesso a ficheiros PHP ou caminhos ocultos comuns
  if (pathname.endsWith('.php') || pathname.startsWith('/.git')) {
    return new NextResponse(null, { status: 404 });
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
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|php)$).*)',
  ],
}
