import dotenv from 'dotenv'
dotenv.config()
const token = process.env.TOKEN

const sessionEndpoint = 'https://api.enablebanking.com/sessions'

export default async function createEnableBankingSession(authCode: string) {
  const response = await fetch(sessionEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // O seu JWT válido
    },
    body: JSON.stringify({ code: authCode })
  });

  const sessionData = await response.json()

  if (!sessionData.accounts) {
    console.log("A API devolveu um erro:", sessionData)
    return null
  }

  console.log("Copia o id da sessão para o .env em SESSION_ID", sessionData.session_id)
}

