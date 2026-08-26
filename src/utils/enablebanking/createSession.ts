const sessionEndpoint = 'https://api.enablebanking.com/sessions'

export default async function createEnableBankingSession(authCode: string, token: string | null): Promise<string | null> {
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

    return sessionData.session_id
  } catch (error) {
    console.error('Falha ao efetuar o pedido à EnableBanking:', error)
    return null
  }
}


