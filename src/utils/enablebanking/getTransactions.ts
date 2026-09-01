import getEnableBankingSession from './getSession'

// Pedir os dados
export default async function getEnableBankingTransactions(
  sessionId: string,
  token: string | null,
  knownAccountId?: string | null,
  dateFrom: string = '2026-08-23'
) {
  if (!sessionId) {
    console.error('ID da sessão não informada')
    return null
  }

  if (!token) {
    console.error('Token não informado')
    return null
  }

  const accountId = knownAccountId || (await getEnableBankingSession(sessionId, token))

  if (!accountId || typeof accountId !== 'string') {
    console.error('Não foi possível obter o ID da conta EnableBanking')
    return null
  }

  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`, // O seu JWT válido
    },
  }

  try {
    const url = new URL(`https://api.enablebanking.com/accounts/${accountId}/transactions`)
    if (dateFrom) {
      url.searchParams.set('date_from', dateFrom)
    }

    const response = await fetch(url.toString(), requestOptions)
    const data = await response.json()

    if (!response.ok || data.error) {
      console.error('Erro na resposta de transações EnableBanking:', data)
      return null
    }

    return Array.isArray(data.transactions) ? data.transactions : []
  } catch (error) {
    console.error('Falha ao obter transações EnableBanking:', error)
    return null
  }
}
