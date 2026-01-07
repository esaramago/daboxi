'use server'

import { Client, Account } from '@node_modules/appwrite'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ENDPOINT, PROJECT_ID } from './config'

/**
 * Creates an authenticated Appwrite client using session cookies
 */
export async function getAuthenticatedClient() {
  console.log('[AppwriteServer] Getting authenticated client...')
  try {
    const cookieStore = await cookies()
    
    // Appwrite stores the session in cookies
    // Tries different cookie name formats
    let sessionCookie = cookieStore.get(`a_session_${PROJECT_ID}`)
    
    // If not found, tries other common formats
    if (!sessionCookie) {
      sessionCookie = cookieStore.get('a_session')
    }
    
    if (!sessionCookie) {
      // Tries to find any cookie that starts with 'a_session'
      const allCookies = cookieStore.getAll()
      sessionCookie = allCookies.find(cookie => cookie.name.startsWith('a_session'))
    }
    
    if (!sessionCookie) {
      console.log('[AppwriteServer] No session cookie found')
      throw new Error('No session found')
    }

    console.log(`[AppwriteServer] Session found, initializing client with endpoint: ${ENDPOINT}`)
    const client = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)

    // Sets the session cookie on the client
    // The cookie value can be the session secret or the complete cookie
    client.setSession(sessionCookie.value)

    return client
  } catch (error) {
    console.error('[AppwriteServer] Error getting authenticated client:', error.message)
    throw new Error('Failed to get authenticated client: ' + error.message)
  }
}

/**
 * Gets the authenticated user from the session
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    const client = await getAuthenticatedClient()
    const account = new Account(client)
    const user = await account.get()
    return {
      user,
      error: null
    }
  } catch (error: any) {
    return {
      user: null,
      error
    }
  }
}

/**
 * Gets the authenticated user ID from the session
 * Throws error if not authenticated
 */
export async function getAuthenticatedUserId() {
  const { user } = await getAuthenticatedUser()
  if (!user) {
    throw new Error('User not authenticated')
  }
  return user.$id
}

/**
 * Checks if the user is authenticated
 * Redirects to login page if not authenticated
 */
export async function requireAuth() {
  const { user, error } = await getAuthenticatedUser()
  if (error) {
    redirect('/login')
  }
  return user
}

/**
 * Gets the session token from cookies
 * Used to pass session token to cached functions
 */
export async function getSessionToken(): Promise<string> {
  const cookieStore = await cookies()
  
  let sessionCookie = cookieStore.get(`a_session_${PROJECT_ID}`)
  
  if (!sessionCookie) {
    sessionCookie = cookieStore.get('a_session')
  }
  
  if (!sessionCookie) {
    const allCookies = cookieStore.getAll()
    sessionCookie = allCookies.find(cookie => cookie.name.startsWith('a_session'))
  }
  
  if (!sessionCookie) {
    throw new Error('No session found')
  }
  
  return sessionCookie.value
}
