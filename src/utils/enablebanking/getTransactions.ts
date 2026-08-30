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

  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`, // O seu JWT válido
    },
  }
  const accountId = knownAccountId || (await getEnableBankingSession(sessionId, token))

  if (!accountId) {
    console.error('Não foi possível obter o ID da conta EnableBanking')
    return null
  }

  const url = new URL(`https://api.enablebanking.com/accounts/${accountId}/transactions`)
  if (dateFrom) {
    url.searchParams.set('date_from', dateFrom)
  }

  const response = await fetch(url.toString(), requestOptions)
  const data = await response.json()

  return data.transactions
}
