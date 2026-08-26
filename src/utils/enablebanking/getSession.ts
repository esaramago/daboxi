import dotenv from 'dotenv'
dotenv.config()
const token = process.env.TOKEN

export default async function getEnableBankingSession(sessionId: string) {
  const response = await fetch(`https://api.enablebanking.com/sessions/${sessionId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json()

  if (data.accounts[0]) {
    return data.accounts[0]
  }
  
  console.log(data.message)
}