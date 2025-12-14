'use server'

import { TablesDB, Query, ID, Account } from '@node_modules/appwrite'
import { getAuthenticatedClient } from './appwriteServer'
import { ENDPOINT, PROJECT_ID, DATABASE_ID, SESSION_COOKIE } from './config'
import { cookies } from 'next/headers'

export { Query, ID }

/**
 * Obtém um cliente Appwrite autenticado
 * Tenta usar a sessão do usuário, caso contrário usa cliente sem autenticação
 */
async function getClient() {
  try {
    return await getAuthenticatedClient()
  } catch (error) {
    throw new Error('Failed to get client: ' + error.message)
  }
}

export async function fetchAppwriteDB(tableId: string, queries?: any[], limit = 100) {
  try {
    const client = await getClient()
    const tablesDB = new TablesDB(client)
    const data = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: tableId,
      queries: [
        ...queries?.map(query => query.toString()),
        Query.limit(limit),
      ],
    })
    return {
      error: false,
      data
    }
  } catch (error) {
    return {
      data: null,
      error
    }
  }
}

export async function getAppwriteRow(tableId: string, rowId: string, queries?: any[]) {
  try {
    const client = await getClient()
    const tablesDB = new TablesDB(client)
    const data = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: tableId,
      rowId: rowId,
      queries: queries?.map(query => query.toString()) || [],
    })
    return {
      error: false,
      data
    }
  } catch (error) {
    return {
      data: null,
      error
    }
  }
}

export async function createAppwriteRow(tableId: string, data: any, permissions?: string[]) {
  try {
    const client = await getClient()
    const tablesDB = new TablesDB(client)

    const result = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: tableId,
      rowId: ID.unique(),
      data,
      permissions: permissions
    })
    return {
      error: false,
      data: result
    }
  } catch (error) {
    return {
      data: null,
      error
    }
  }
}

export async function updateAppwriteRow(tableId: string, rowId: string, data: any, permissions?: string[]) {
  try {
    const client = await getClient()
    const tablesDB = new TablesDB(client)
    const result = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId,
      rowId,
      data,
      permissions
    })
    return {
      error: false,
      data: result
    }
  } catch (error) {
    return {
      data: null,
      error
    }
  }
}

export async function deleteAppwriteRow(tableId: string, rowId: string) {
  try {
    const client = await getClient()
    const tablesDB = new TablesDB(client)
    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId,
      rowId,
    })
    return {
      error: false,
      data: null
    }
  } catch (error) {
    return {
      data: null,
      error
    }
  }
}

export async function login(email: string, password: string) {

  try {
    // 1. Fazer o pedido manualmente (sem SDK) para ter acesso aos headers
    const response = await fetch(`${ENDPOINT}/account/sessions/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data,
        data: null
      }
    }

    // 2. Extrair o token secreto
    let sessionSecret = data.secret

    // Se não vier no JSON (o teu caso), vamos buscá-lo ao cabeçalho 'set-cookie'
    if (!sessionSecret) {
      const setCookieHeader = response.headers.get('set-cookie')

      if (setCookieHeader) {
        
        // Explicação da Regex:
        // 1. Procura exatamente o nome do cookie seguido de '='
        // 2. ([^;]+) Captura tudo o que vem a seguir ATÉ encontrar um ';' ou o fim da linha
        const regex = new RegExp(`${SESSION_COOKIE}=([^;]+)`);
        const match = setCookieHeader.match(regex);

        if (match && match[1]) {
          sessionSecret = match[1]; // O valor capturado
        }
      }
    }

    if (!sessionSecret) {
      return {
        error: 'No session secret found',
        data: null
      }
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, sessionSecret, {
      path: '/',
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return {
      error: false,
      data
    }
  } catch (error) {
    return {
      error: error,
      data: null
    }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)

  if (!sessionCookie) {
    return {
      error: false,
      data: 'No session cookie found'
    }
  }

  try {
    // Usar o SDK Appwrite que gerencia a autenticação corretamente
    const client = await getAuthenticatedClient()
    const account = new Account(client)
    
    // Deletar a sessão no Appwrite
    await account.deleteSession('current')

    // Deletar o cookie localmente
    cookieStore.delete(SESSION_COOKIE)

    return {
      error: false,
      data: 'Logged out successfully'
    }

  } catch (error: any) {
    // Mesmo se houver erro ao deletar no servidor, deletar o cookie localmente
    cookieStore.delete(SESSION_COOKIE)
    
    return {
      error: error,
      data: null
    }
  }
}