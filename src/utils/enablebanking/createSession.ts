const sessionEndpoint = 'https://api.enablebanking.com/sessions'

export interface EnableBankingSessionResponse {
  sessionId: string
  accounts: string[]
  validUntil?: string
  status?: string
}

export default async function createEnableBankingSession(
  authCode: string,
  token: string | null
): Promise<EnableBankingSessionResponse | null> {
  if (!authCode) {
    console.error('Código de autorização não informado')
    return null
  }
  if (!token) {
    return null
  }

  try {
    const response = await fetch(sessionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ code: authCode })
    })

    const sessionData = await response.json()

    if (!response.ok || sessionData.error || !sessionData.session_id) {
      console.error('Erro ao criar sessão EnableBanking:', sessionData)
      return null
    }

    const accounts = Array.isArray(sessionData.accounts)
      ? sessionData.accounts
          .map((acc: any) => (typeof acc === 'string' ? acc : acc?.uid || acc?.account_id || ''))
          .filter(Boolean)
      : []

    return {
      sessionId: sessionData.session_id,
      accounts,
      validUntil: sessionData.access?.valid_until,
      status: sessionData.status || 'AUTHORIZED'
    }
  } catch (error) {
    console.error('Falha ao efetuar o pedido à EnableBanking:', error)
    return null
  }
}


