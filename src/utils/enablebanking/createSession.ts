const sessionEndpoint = 'https://api.enablebanking.com/sessions'

export default async function createEnableBankingSession(authCode: string, token: string) {
  if (!authCode) {
    console.error('Código de autorização não informado')
    return null
  }
  if (!token) {
    console.error('Token não informado')
    return null
  }
  const response = await fetch(sessionEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // O seu JWT válido
    },
    body: JSON.stringify({ code: authCode })
  });

  const sessionData = await response.json()

  if (sessionData.error) {

    if (sessionData.error === 'ALREADY_AUTHORIZED') {
      return {
        error: 'A conta já foi autorizada anteriormente',
        data: null
      }
    }
    return {
      error: sessionData.message,
      data: null
    }
  }

  return sessionData.session_id
}

