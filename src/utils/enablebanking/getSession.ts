export default async function getEnableBankingSession(sessionId: string, token: string) {
  const response = await fetch(`https://api.enablebanking.com/sessions/${sessionId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await response.json()

  if (data.error || !data.accounts || !data.accounts[0]) {
    return {
      error: data.message,
      data: null
    }
  }

  return data.accounts[0]

}