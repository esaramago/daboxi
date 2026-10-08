import { NextRequest } from 'next/server'

export default function getBaseUrl(request?: NextRequest): string {
  if (request) {
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    if (host) {
      return `${proto}://${host}`
    }
  }

  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
}
