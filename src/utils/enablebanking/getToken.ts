import jwt from 'jsonwebtoken'

export default function getEnableBankingToken(): string | null {
  const applicationId = process.env.ENABLEBANKING_APP_ID || process.env.APPLICATION_ID
  const rawPrivateKey = process.env.ENABLEBANKING_PRIVATE_KEY

  if (!applicationId) {
    console.error('ENABLEBANKING_APP_ID não está configurado nas variáveis de ambiente.')
    return null
  }

  if (!rawPrivateKey) {
    console.error('ENABLEBANKING_PRIVATE_KEY não está configurado nas variáveis de ambiente.')
    return null
  }

  // Substitui eventuais \n literais por quebras de linha reais
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n')

  const iat = Math.floor(Date.now() / 1000)
  const payload = {
    iss: 'enablebanking.com',
    aud: 'api.enablebanking.com',
    iat: iat,
    exp: iat + 3600 * 3
  }

  try {
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      keyid: applicationId
    })
    return token
  } catch (error) {
    console.error('Erro ao gerar o token EnableBanking:', error)
    return null
  }
}