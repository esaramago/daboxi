import PocketBase from 'pocketbase'
import { cookies } from 'next/headers'
import { POCKETBASE_URL, PB_COOKIE_NAME } from './config'

/**
 * Creates an authenticated PocketBase instance using session cookies
 */
export async function getPocketBase() {
  const pb = new PocketBase(POCKETBASE_URL)
  pb.autoCancellation(false)

  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get(PB_COOKIE_NAME)

    if (authCookie?.value) {
      // PocketBase loadFromCookie expects "pb_auth=..." or encoded JSON
      pb.authStore.loadFromCookie(`${PB_COOKIE_NAME}=${authCookie.value}`)

      // Fallback if loadFromCookie didn't populate token (e.g. if raw token was stored)
      if (!pb.authStore.token && authCookie.value.length > 20) {
        try {
          const parsed = JSON.parse(decodeURIComponent(authCookie.value))
          pb.authStore.save(parsed.token || '', parsed.record || parsed.model || null)
        } catch {
          pb.authStore.save(authCookie.value, null)
        }
      }
    }
  } catch (err) {
    // Ignore in contexts without cookies
  }

  return pb
}

/**
 * Creates an unauthenticated PocketBase instance
 */
export function getPublicPocketBase() {
  const pb = new PocketBase(POCKETBASE_URL)
  pb.autoCancellation(false)
  return pb
}

/**
 * Helper to recursively map PocketBase records and their expansions
 * ensuring $id is set alongside id and expansions are flattened.
 */
export function formatRecord<T = any>(record: any): T {
  if (!record) return record

  if (Array.isArray(record)) {
    return record.map(r => formatRecord(r)) as unknown as T
  }

  const formatted: any = {
    ...record,
    $id: record.id,
  }

  // Normalize netValue: In PocketBase, empty number fields can default to 0.
  // In Daboxi, netValue must be null unless there is a linked refund (or non-zero netValue).
  if (formatted.netValue === 0 && (!formatted.refundsIds || formatted.refundsIds === '')) {
    formatted.netValue = null
  }

  if (record.expand) {
    for (const key of Object.keys(record.expand)) {
      const expandedVal = record.expand[key]
      if (Array.isArray(expandedVal)) {
        formatted[key] = expandedVal.map(formatRecord)
      } else if (expandedVal && typeof expandedVal === 'object') {
        formatted[key] = formatRecord(expandedVal)
      }
    }
  }

  return formatted as T
}
