import { NextRequest } from 'next/server'

export default function getBaseUrl(request?: NextRequest): string {
  // 1. Verificar variável de ambiente configurada explicitamente (se válida e não 0.0.0.0)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl && !envUrl.includes('0.0.0.0')) {
    return envUrl.replace(/\/+$/, '')
  }

  if (request) {
    // 2. Verificar cabeçalhos de reverse proxy (Nginx, Traefik, Caddy, Cloudflare)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    if (forwardedHost && !forwardedHost.includes('0.0.0.0')) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, '')
    }

    // 3. Verificar cabeçalho Host da requisição
    const host = request.headers.get('host')
    if (host && !host.includes('0.0.0.0')) {
      const proto = request.headers.get('x-forwarded-proto') || request.nextUrl?.protocol || 'http:'
      const cleanProto = proto.endsWith(':') ? proto.slice(0, -1) : proto
      return `${cleanProto}://${host}`.replace(/\/+$/, '')
    }

    // 4. Fallback pelo request.nextUrl
    if (request.nextUrl?.origin) {
      return request.nextUrl.origin.replace('0.0.0.0', 'localhost').replace(/\/+$/, '')
    }
  }

  return 'http://localhost:3000'
}

