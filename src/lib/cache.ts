'use server'

import { unstable_cache } from 'next/cache'
import crypto from 'crypto'

/**
 * Cache TTL: 1 week (604800 seconds)
 */
const CACHE_TTL = 604800

/**
 * Helper function to cache data using Next.js unstable_cache.
 * This version does not accept functions that read cookies() or other dynamic sources.
 * 
 * @param cacheKey - Unique key for the cache
 * @param fetchFn - Function returning the data to cache (cannot use cookies, headers, etc.)
 * @param tags - Optional tags for cache invalidation
 * @returns Cached data or result of fetchFn
 */
export async function getCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  tags?: string[]
): Promise<T> {
  const cachedFn = unstable_cache(
    async () => {
      return await fetchFn()
    },
    [cacheKey],
    {
      revalidate: CACHE_TTL,
      tags: tags || [cacheKey],
    }
  )

  return await cachedFn()
}

/**
 * Helper function to cache data requiring a session token.
 * Retrieves the session token outside the cache and creates a cached closure over the token.
 * 
 * Each user/session receives their own isolated cache entry based on a SHA-256 token digest.
 * 
 * @param cacheKey - Base key for the cache (combined with cryptographic token hash)
 * @param fetchFn - Function receiving sessionToken and returning data
 * @param getSessionToken - Function obtaining the session token (called outside cache)
 * @param tags - Optional tags for cache invalidation
 * @returns Cached data or result of fetchFn
 */
export async function getCachedDataWithSession<T>(
  cacheKey: string,
  fetchFn: (sessionToken: string) => Promise<T>,
  getSessionToken: () => Promise<string>,
  tags?: string[]
): Promise<T> {
  // Retrieve session token outside cache
  const sessionToken = await getSessionToken()
  
  // Generate a SHA-256 cryptographic hash to guarantee collision-free cache keys across users
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex')
  const uniqueCacheKey = `${cacheKey}-${tokenHash}`
  
  // Create a function that closes over the token
  const fetchWithToken = async () => {
    return await fetchFn(sessionToken)
  }
  
  const cachedFn = unstable_cache(
    fetchWithToken,
    [uniqueCacheKey],
    {
      revalidate: CACHE_TTL,
      tags: tags || [cacheKey],
    }
  )

  return await cachedFn()
}


