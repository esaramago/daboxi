import getEnableBankingToken from './getToken'

export interface EnableBankingAspsp {
  name: string
  country: string
  title?: string
  logo?: string
  bic?: string
  [key: string]: any
}

const aspspsEndpoint = 'https://api.enablebanking.com/aspsps'

export default async function getEnableBankingAspsps(country?: string): Promise<EnableBankingAspsp[]> {
  const token = getEnableBankingToken()
  if (!token) {
    console.error('Token não disponível para obter lista de ASPSPs da EnableBanking')
    return []
  }

  try {
    const response = await fetch(aspspsEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      next: { revalidate: 86400 } // Cache por 24 horas
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro ao obter ASPSPs da EnableBanking:', response.status, errorText)
      return []
    }

    const data = await response.json()
    const aspsps: EnableBankingAspsp[] = Array.isArray(data.aspsps) ? data.aspsps : []

    if (country) {
      const targetCountry = country.trim().toUpperCase()
      return aspsps.filter((aspsp) => aspsp.country?.toUpperCase() === targetCountry)
    }

    return aspsps
  } catch (error) {
    console.error('Falha ao efetuar o pedido à EnableBanking para obter ASPSPs:', error)
    return []
  }
}

