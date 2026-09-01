const endpoint = 'https://api.enablebanking.com/auth'

export default async function getEnableBankingAuthLink(
  redirectUrl: string,
  token: string | null,
  bankName: string,
  country: string
) {
  if (!redirectUrl) {
    console.error('URL de redirecionamento não informada')
    return null
  }

  if (!token) {
    console.error('Token não informado')
    return null
  }

  if (!bankName || !country) {
    console.error('Nome do banco ou país não configurados')
    return null
  }
      
  const requestBody = {
    response_type: 'code',
    access: {
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    aspsp: {
      name: bankName,
      country: country
    },
    redirect_url: redirectUrl,
    state: 'SPys89MuHAGf010zJbMFm9UTeRUTB1cDTHcAT3rX6pRu18R3tJzQGKfwJxV0mBPv' 
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (response.ok) {
      console.log('Redirecione o utilizador para este URL:\n', data.url)
      return data.url
    } else {
      console.error('A API EnableBanking devolveu um erro:', data)
      return null
    }
  } catch (error) {
    console.error('Falha ao efetuar o pedido à EnableBanking:', error)
    return null
  }
}
