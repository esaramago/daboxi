import jwt from 'jsonwebtoken'
import crypto from 'crypto'

function parsePrivateKey(rawKey: string): crypto.KeyObject {
  let str = rawKey.trim()

  // 1. Remove aspas envolventes (simples ou duplas)
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim()
  }

  // 2. Remove escapes de aspas e quebras de linha
  str = str.replace(/\\"/g, '"').replace(/\\'/g, "'")
  str = str.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n')

  // 3. Se a string inteira for uma codificação Base64 do ficheiro PEM
  if (!str.includes('BEGIN')) {
    try {
      const decoded = Buffer.from(str.replace(/\s+/g, ''), 'base64').toString('utf-8')
      if (decoded.includes('BEGIN')) {
        str = decoded.trim()
      }
    } catch (_) {}
  }

  // 4. Extrai exclusivamente o corpo Base64 removendo cabeçalhos, rodapés e espaços
  const base64Body = str
    .replace(/-----BEGIN[^-]+-----/g, '')
    .replace(/-----END[^-]+-----/g, '')
    .replace(/\\r\\n/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '')

  // 5. Formata com quebras a cada 64 caracteres (padrão estrito PEM)
  const formattedBody = base64Body.match(/.{1,64}/g)?.join('\n') || base64Body

  // 6. Tenta PKCS#8 (padrão moderno "-----BEGIN PRIVATE KEY-----")
  const pkcs8Pem = `-----BEGIN PRIVATE KEY-----\n${formattedBody}\n-----END PRIVATE KEY-----\n`
  try {
    return crypto.createPrivateKey(pkcs8Pem)
  } catch (_) {}

  // 7. Tenta PKCS#1 (padrão tradicional "-----BEGIN RSA PRIVATE KEY-----")
  const pkcs1Pem = `-----BEGIN RSA PRIVATE KEY-----\n${formattedBody}\n-----END RSA PRIVATE KEY-----\n`
  try {
    return crypto.createPrivateKey(pkcs1Pem)
  } catch (_) {}

  // 8. Tenta formato binário DER diretamente
  try {
    const derBuf = Buffer.from(base64Body, 'base64')
    try {
      return crypto.createPrivateKey({ key: derBuf, format: 'der', type: 'pkcs8' })
    } catch (_) {
      return crypto.createPrivateKey({ key: derBuf, format: 'der', type: 'pkcs1' })
    }
  } catch (_) {}

  // 9. Fallback direto
  return crypto.createPrivateKey(str)
}

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

  const iat = Math.floor(Date.now() / 1000)
  const payload = {
    iss: 'enablebanking.com',
    aud: 'api.enablebanking.com',
    iat: iat,
    exp: iat + 3600 * 3
  }

  try {
    const privateKey = parsePrivateKey(rawPrivateKey)
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      keyid: applicationId
    })
    return token
  } catch (error) {
    console.error('Erro ao processar chave / gerar token EnableBanking:', error)
    return null
  }
}