import getEnableBankingSession from './getSession'

// Pedir os dados
export default async function getEnableBankingTransactions(sessionId: string, token: string) {

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
  const accountId = await getEnableBankingSession(sessionId, token)

  if (!accountId) {
    console.error('Não foi possível obter o ID da conta EnableBanking')
    return null
  }
  const transactionsUrl = `https://api.enablebanking.com/accounts/${accountId}/transactions`

  const response = await fetch(transactionsUrl, requestOptions)
  const data = await response.json()

  return data.transactions
}
