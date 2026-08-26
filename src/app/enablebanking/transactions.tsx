import { useRouter } from 'next/navigation'

import Header from '@/components/Header'
import getAuthLink from '@/utils/enablebanking/getEnableBankingAuthLink'
const router = useRouter()

export default async function EnableBankingTransactions() {

  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (code) {

    alert('TODO: Pegar o token')
  } else {
    const url = window.location.href
    const redirectUrlWithParameters = await getAuthLink(`${url}/enablebanking/callback`)
    router.push(redirectUrlWithParameters)
  }

  return (
    <>
      <Header>Transações EnableBanking</Header>

      <main className="l-container l-stack u-padding-block">
        
      </main>
    </>
  )
}
