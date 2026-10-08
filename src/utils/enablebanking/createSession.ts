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

    let accounts = Array.isArray(sessionData.accounts)
      ? sessionData.accounts
          .map((acc: any) => (typeof acc === 'string' ? acc : acc?.uid || acc?.account_id || ''))
          .filter(Boolean)
      : []

    if (accounts.length === 0 && Array.isArray(sessionData.accounts_data)) {
      accounts = sessionData.accounts_data
        .map((acc: any) => (typeof acc === 'string' ? acc : acc?.uid || acc?.account_id?.iban || acc?.account_id || ''))
        .filter(Boolean)
    }

    // If accounts array is still empty, fetch GET /sessions/:sessionId to resolve them
    if (accounts.length === 0 && sessionData.session_id && token) {
      try {
        const detailRes = await fetch(`${sessionEndpoint}/${sessionData.session_id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (detailRes.ok) {
          const detailData = await detailRes.json()
          if (Array.isArray(detailData.accounts) && detailData.accounts.length > 0) {
            accounts = detailData.accounts
              .map((acc: any) => (typeof acc === 'string' ? acc : acc?.uid || acc?.account_id || ''))
              .filter(Boolean)
          } else if (Array.isArray(detailData.accounts_data) && detailData.accounts_data.length > 0) {
            accounts = detailData.accounts_data
              .map((acc: any) => (typeof acc === 'string' ? acc : acc?.uid || acc?.account_id?.iban || acc?.account_id || ''))
              .filter(Boolean)
          }
        }
      } catch (err) {
        console.warn('Erro ao obter detalhes adicionais da sessão EnableBanking:', err)
      }
    }

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


