import { NextRequest } from 'next/server'

/**
 * Resolves the trusted application base URL.
 * Prioritizes the configured NEXT_PUBLIC_APP_URL to prevent Host Header Injection
 * and Open Redirect vulnerabilities in OAuth redirects and internal navigation.
 */
export default function getBaseUrl(request?: NextRequest): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '')

  // In production, strictly enforce the configured canonical app URL
  if (process.env.NODE_ENV === 'production' && configuredUrl) {
    return configuredUrl
  }

  // If a request is provided in non-production, only allow safe local development hosts
  if (request) {
    const proto = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')

    if (host) {
      const hostname = host.split(':')[0].toLowerCase()
      const isAllowedLocalHost =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]'

      // Only trust the request host if it matches local development or the configured domain
      if (isAllowedLocalHost) {
        return `${proto}://${host}`
      }

      if (configuredUrl) {
        try {
          const parsedConfigured = new URL(configuredUrl)
          if (hostname === parsedConfigured.hostname.toLowerCase()) {
            return `${proto}://${host}`
          }
        } catch {
          // Ignore invalid configured URL and fall through
        }
      }
    }
  }

  return configuredUrl || 'http://localhost:3000'
}
