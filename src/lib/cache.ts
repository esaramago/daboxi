'use server'

import { unstable_cache } from 'next/cache'

/**
 * Cache TTL: 1 semana (604800 segundos)
 */
const CACHE_TTL = 604800

/**
 * Helper function para cachear dados usando unstable_cache do Next.js
 * Esta versão não aceita funções que usam cookies() ou outras fontes dinâmicas
 * 
 * @param cacheKey - Chave única para o cache
 * @param fetchFn - Função que retorna os dados a serem cacheados (não pode usar cookies, headers, etc)
 * @param tags - Tags opcionais para invalidação de cache
 * @returns Dados cacheados ou resultado da função fetch
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
 * Helper function para cachear dados que precisam de session token
 * Obtém o session token fora do cache e cria uma função cacheada que fecha sobre o token
 * 
 * IMPORTANTE: Esta função cria um cache por token de sessão. Cada usuário terá seu próprio cache.
 * 
 * @param cacheKey - Chave única para o cache (será combinada com hash do token)
 * @param fetchFn - Função que recebe sessionToken e retorna os dados
 * @param getSessionToken - Função que obtém o session token (chamada fora do cache)
 * @param tags - Tags opcionais para invalidação de cache
 * @returns Dados cacheados ou resultado da função fetch
 */
export async function getCachedDataWithSession<T>(
  cacheKey: string,
  fetchFn: (sessionToken: string) => Promise<T>,
  getSessionToken: () => Promise<string>,
  tags?: string[]
): Promise<T> {
  // Obter session token fora do cache
  const sessionToken = await getSessionToken()
  
  // Criar uma chave única baseada no cacheKey e no token
  // Usamos um hash simples do token para criar uma chave estável e única
  // Isso garante que cada usuário tenha seu próprio cache
  const tokenHash = Buffer.from(sessionToken).toString('base64').substring(0, 16).replace(/[^a-zA-Z0-9]/g, '')
  const uniqueCacheKey = `${cacheKey}-${tokenHash}`
  
  // Criar uma função que fecha sobre o token
  // Esta função será estática para o mesmo token, permitindo cache eficiente
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

