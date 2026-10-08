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

    const hasAccounts = Array.isArray(data.accounts) && data.accounts.length > 0
    const hasAccountsData = Array.isArray(data.accounts_data) && data.accounts_data.length > 0

    if (!response.ok || data.error || (!hasAccounts && !hasAccountsData)) {
      console.error('Erro ao obter sessão EnableBanking:', data)
      return null
    }

    if (hasAccounts) {
      const account = data.accounts[0]
      const uid = typeof account === 'string' ? account : account?.uid || account?.account_id || null
      if (uid) return uid
    }

    if (hasAccountsData) {
      const accountData = data.accounts_data[0]
      const uid = typeof accountData === 'string' ? accountData : accountData?.uid || accountData?.account_id?.iban || accountData?.account_id || null
      if (uid) return uid
    }

    return null
  } catch (error) {
    console.error('Falha ao obter sessão EnableBanking:', error)
    return null
  }
}