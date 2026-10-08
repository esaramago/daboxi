import getEnableBankingToken from './getToken'

export interface EnableBankingAspsp {
  name: string
  country: string
  title?: string
  logo?: string
  bic?: string
  [key: string]: any
}

const aspspsEndpoint = 'https://api.enablebanking.com/aspsps'

interface CacheEntry {
  data: EnableBankingAspsp[]
  timestamp: number
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const memoryCache = new Map<string, CacheEntry>()
const inFlightRequests = new Map<string, Promise<EnableBankingAspsp[]>>()

export default async function getEnableBankingAspsps(country?: string): Promise<EnableBankingAspsp[]> {
  const targetCountry = country?.trim().toUpperCase()
  const cacheKey = targetCountry || '__ALL__'

  // 1. Check in-memory cache
  const cached = memoryCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  // 2. If targetCountry is requested and __ALL__ is cached, filter from memory
  if (targetCountry) {
    const allCached = memoryCache.get('__ALL__')
    if (allCached && Date.now() - allCached.timestamp < CACHE_TTL_MS) {
      const filtered = allCached.data.filter((aspsp) => aspsp.country?.toUpperCase() === targetCountry)
      memoryCache.set(cacheKey, { data: filtered, timestamp: allCached.timestamp })
      return filtered
    }
  }

  // 3. Deduplicate concurrent requests
  const inFlight = inFlightRequests.get(cacheKey)
  if (inFlight) {
    return inFlight
  }

  const fetchPromise = (async () => {
    const token = getEnableBankingToken()
    if (!token) {
      console.error('Token não disponível para obter lista de ASPSPs da EnableBanking')
      return []
    }

    try {
      const url = targetCountry
        ? `${aspspsEndpoint}?country=${encodeURIComponent(targetCountry)}`
        : aspspsEndpoint

      // Use cache: 'no-store' to avoid Next.js Data Cache 2MB limit (EnableBanking full catalog is >4MB)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro ao obter ASPSPs da EnableBanking:', response.status, errorText)
        return []
      }

      const data = await response.json()
      const aspsps: EnableBankingAspsp[] = Array.isArray(data.aspsps) ? data.aspsps : []

      const result = targetCountry
        ? aspsps.filter((aspsp) => aspsp.country?.toUpperCase() === targetCountry)
        : aspsps

      memoryCache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error('Falha ao efetuar o pedido à EnableBanking para obter ASPSPs:', error)
      return []
    } finally {
      inFlightRequests.delete(cacheKey)
    }
  })()

  inFlightRequests.set(cacheKey, fetchPromise)
  return fetchPromise
}

