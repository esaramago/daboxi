export default async function getEnableBankingSession(sessionId: string, token: string | null) {
  if (!sessionId || !token) {
    console.error('SessionId ou Token não informado')
    return null
  }

  try {
    const response = await fetch(`https://api.enablebanking.com/sessions/${sessionId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()

    if (!response.ok || data.error || !data.accounts || !data.accounts[0]) {
      console.error('Erro ao obter sessão EnableBanking:', data)
      return null
    }

    const account = data.accounts[0]
    return typeof account === 'string' ? account : account.uid || account.account_id || null
  } catch (error) {
    console.error('Falha ao obter sessão EnableBanking:', error)
    return null
  }
}