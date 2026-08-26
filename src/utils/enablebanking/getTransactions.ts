import getEnableBankingSession from './getSession'

const token = process.env.TOKEN
const sessionId = process.env.SESSION_ID

const requestOptions = {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`, // O seu JWT válido
  },
}

// Pedir os dados
export default async function getEnableBankingTransactions() {
  const accountId = await getEnableBankingSession(sessionId)

  if (!accountId) {
    console.error('Não foi possível obter o ID da conta EnableBanking')
    return null
  }
  const transactionsUrl = `https://api.enablebanking.com/accounts/${accountId}/transactions`

  const response = await fetch(transactionsUrl, requestOptions)
  const data = await response.json()
  debugger
  return data
}
