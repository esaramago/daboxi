import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Bloqueia tentativas de acesso a ficheiros PHP ou caminhos ocultos comuns
  if (pathname.endsWith('.php') || pathname.startsWith('/.git')) {
    return new NextResponse(null, { status: 404 });
  }

  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const sessionCookie =
    (projectId ? request.cookies.get(`a_session_${projectId}`) : null) ||
    request.cookies.get('a_session') ||
    request.cookies.getAll().find(cookie => cookie.name.startsWith('a_session') && cookie.value);

  const isAuthenticated = Boolean(sessionCookie && sessionCookie.value);

  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
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

