import { redirect } from 'next/navigation'

import Header from '@/components/Header'
import getEnableBankingAuthLink from '@/utils/enablebanking/getAuthLink'
import createEnableBankingSession from '@/utils/enablebanking/createSession'
import getEnableBankingTransactions from '@/utils/enablebanking/getTransactions'

export default async function EnableBankingTransactions({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  
  const sp = await searchParams
  const code = sp?.code as string | undefined

  if (code) {
    await createEnableBankingSession(code)
    const transactions = await getEnableBankingTransactions()
    debugger
  } else {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    const redirectUrl = await getEnableBankingAuthLink(`${baseUrl}/enablebanking/callback`)

    if (redirectUrl) {
      redirect(redirectUrl)
    }
  }

  return (
    <>
      <Header>Transações EnableBanking</Header>

      <main className="l-container l-stack u-padding-block">
        
        {code ? <p>Código recebido: {code}</p> : <p>A redirecionar...</p>}
      </main>
    </>
  )
}
