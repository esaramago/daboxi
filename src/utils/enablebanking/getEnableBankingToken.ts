import jwt from 'jsonwebtoken'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const applicationId = process.env.APPLICATION_ID
const privateKeyPath = `${applicationId}.pem`

// Ler a chave privada
const privateKey = fs.readFileSync(privateKeyPath, 'utf8')

const iat = Math.floor(Date.now() / 1000)
const payload = {
  iss: 'enablebanking.com',
  aud: 'api.enablebanking.com',
  iat: iat,
  exp: iat + 3600*3
}

// Gerar o JWT especificando o algoritmo e o 'kid' no cabeçalho

export default function getToken() {
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    keyid: applicationId
  })
  return token
}