import getToken from './getEnableBankingToken'
import dotenv from 'dotenv'
dotenv.config()

const endpoint = 'https://api.enablebanking.com/auth'

// Dados necessários para iniciar a ligação
const requestBody = {
  response_type: 'code',
  access: {
    // Validade do consentimento (ex: 90 dias a partir de hoje)
    valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  aspsp: {
    name: process.env.ENABLEBANKING_BANK_NAME, // O nome do banco que o utilizador vai escolher
    country: process.env.ENABLEBANKING_COUNTRY // O país de registo da sua conta Revolut
  },
  // O URL exato que configurou no portal do Enable Banking
  redirect_url: 'enablebanking/callback',
  // Um valor único gerado por si para validar o regresso do utilizador (segurança contra CSRF)
  state: 'SPys89MuHAGf010zJbMFm9UTeRUTB1cDTHcAT3rX6pRu18R3tJzQGKfwJxV0mBPv' 
}

export default async function getAuthLink(redirectUrl: string) {
  if (!redirectUrl) {
    console.error('URL de redirecionamento não informada')
    return null
  }

  requestBody.redirect_url = redirectUrl

  const token = getToken()

  if (!token) {
    console.error('Token não gerado')  
    return null
  }
      
  console.log('Token:', token)
  
  try {
    requestBody.redirect_url = redirectUrl
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
      console.error('A API devolveu um erro:', data)
    }
  } catch (error) {
    console.error('Falha ao efetuar o pedido:', error)
  }
}
