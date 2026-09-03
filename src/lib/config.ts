function resolvePocketBaseUrl(): string {
  let url = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

  // If running locally outside Docker and POCKETBASE_URL is set to docker service name 'pocketbase'
  if (url.includes('//pocketbase:') && process.env.NODE_ENV !== 'production') {
    url = url.replace('//pocketbase:', '//127.0.0.1:')
  }

  return url
}

export const POCKETBASE_URL = resolvePocketBaseUrl()
export const PB_COOKIE_NAME = 'pb_auth'