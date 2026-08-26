import jwt from 'jsonwebtoken'
import crypto from 'crypto'

function formatPrivateKey(rawKey: string): string {
  let key = rawKey.trim()

  // 1. Remove surrounding quotes (single, double, or escaped quotes)
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim()
  }

  // 2. Unescape escaped quotes if any
  key = key.replace(/\\"/g, '"').replace(/\\'/g, "'")

  // 3. Handle base64-encoded PEM (e.g. key encoded into a single base64 string)
  if (!key.includes('BEGIN') && /^[A-Za-z0-9+/=\s]+$/.test(key)) {
    try {
      const decoded = Buffer.from(key.replace(/\s+/g, ''), 'base64').toString('utf-8')
      if (decoded.includes('BEGIN')) {
        key = decoded.trim()
      }
    } catch (_) {
      // Keep original if decoding fails
    }
  }

  // 4. Replace escaped newlines
  key = key.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n')

  // 5. If it is standard PEM format, ensure proper line breaks for header, body, and footer
  const pemMatch = key.match(/(-----BEGIN[^-]+-----)([\s\S]+?)(-----END[^-]+-----)/)
  if (pemMatch) {
    const header = pemMatch[1].trim()
    const body = pemMatch[2].replace(/\s+/g, '')
    const footer = pemMatch[3].trim()
    const formattedBody = body.match(/.{1,64}/g)?.join('\n') || body
    return `${header}\n${formattedBody}\n${footer}\n`
  }

  // 6. If only raw base64 body was provided without PEM headers, try wrapping in PKCS#8 and PKCS#1
  const cleanBody = key.replace(/\s+/g, '')
  if (/^[A-Za-z0-9+/=]+$/.test(cleanBody)) {
    const formattedBody = cleanBody.match(/.{1,64}/g)?.join('\n') || cleanBody
    const candidatePkcs8 = `-----BEGIN PRIVATE KEY-----\n${formattedBody}\n-----END PRIVATE KEY-----\n`
    try {
      crypto.createPrivateKey(candidatePkcs8)
      return candidatePkcs8
    } catch (_) {}

    const candidatePkcs1 = `-----BEGIN RSA PRIVATE KEY-----\n${formattedBody}\n-----END RSA PRIVATE KEY-----\n`
    try {
      crypto.createPrivateKey(candidatePkcs1)
      return candidatePkcs1
    } catch (_) {}
  }

  return key
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

  const privateKey = formatPrivateKey(rawPrivateKey)

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