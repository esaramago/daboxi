'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPocketBase } from './pocketbase'
import { PB_COOKIE_NAME, POCKETBASE_URL } from './config'

/**
 * Gets the authenticated user from the session
 */
export async function getAuthenticatedUser() {
  try {
    const pb = await getPocketBase()
    
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return {
        user: null,
        error: new Error('User not authenticated')
      }
    }

    const user = {
      ...pb.authStore.record,
      $id: pb.authStore.record.id
    }

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
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  return user.id || user.$id
}

/**
 * Checks if user is authenticated and redirects to login if not
 */
export async function requireAuth() {
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) {
    redirect('/login')
  }
  return user
}

/**
 * Log in with email and password
 */
export async function login(email: string, password: string) {
  try {
    const pb = await getPocketBase()
    const authData = await pb.collection('users').authWithPassword(email, password)

    if (!authData.token || !authData.record) {
      return {
        error: 'Falha na autenticação',
        data: null
      }
    }

    const cookieStore = await cookies()
    const cookieHeader = pb.authStore.exportToCookie({
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    // Extract cookie value from exported header (pb_auth=<value>; Path=/; ...)
    const match = cookieHeader.match(new RegExp(`${PB_COOKIE_NAME}=([^;]+)`))
    const cookieValue = match ? match[1] : pb.authStore.exportToCookie()

    cookieStore.set(PB_COOKIE_NAME, cookieValue, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return {
      error: false,
      data: {
        ...authData.record,
        $id: authData.record.id
      }
    }
  } catch (error: any) {
    console.error('[PocketBase Auth] Login error:', error)

    let message = 'Email ou palavra-passe incorretos'
    if (error?.status === 400) {
      message = 'Email ou palavra-passe incorretos'
    } else if (
      error?.message?.includes('fetch failed') ||
      error?.cause?.code === 'ECONNREFUSED' ||
      error?.cause?.code === 'ENOTFOUND'
    ) {
      message = `Não foi possível conectar ao PocketBase em "${POCKETBASE_URL}". Verifica se o PocketBase está a correr e se no ficheiro .env tens POCKETBASE_URL=http://127.0.0.1:8090.`
    } else if (error?.message) {
      message = error.message
    }

    return {
      error: message,
      data: null
    }
  }
}

/**
 * Log out user
 */
export async function logout() {
  try {
    const pb = await getPocketBase()
    pb.authStore.clear()
    
    const cookieStore = await cookies()
    cookieStore.delete(PB_COOKIE_NAME)
  } catch (error: any) {
    console.error('[PocketBase Auth] Logout error:', error)
  }

  return {
    error: false,
    data: 'Logged out successfully'
  }
}
