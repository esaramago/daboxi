import { redirect } from 'next/navigation'

import Header from '@/components/Header'
import getEnableBankingAuthLink from '@/utils/enablebanking/getAuthLink'
import createEnableBankingSession from '@/utils/enablebanking/createSession'
import getEnableBankingTransactions from '@/utils/enablebanking/getTransactions'
import getEnableBankingToken from '@/utils/enablebanking/getToken'
import fetchActiveBankSession from '@/api/fetchActiveBankSession'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL

export default async function EnableBankingTransactions({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  
  const sp = await searchParams
  const code = sp?.code as string | undefined || process.env.CODE as string | undefined

  const token = getEnableBankingToken()

  let transactions: any[] = []
  let authUrl = ''

  if (code) {
    let sessionId = ''
    const session = await fetchActiveBankSession()
    if (!session.error && session.data.sessionId) {
      sessionId = session.data.sessionId
    } else {
      sessionId = await createEnableBankingSession(code, token)
    }
    if (!sessionId) {
      console.error('Não foi possível obter o ID da sessão EnableBanking')
      return
    }
    const transactionsData = await getEnableBankingTransactions(sessionId, token)
    transactions = transactionsData
  } else {
    authUrl = await getEnableBankingAuthLink(`${baseUrl}/enablebanking/callback`, token)
  }

  return (
    <>
      <Header>Transações EnableBanking</Header>

      <main className="l-container l-stack u-padding-block">

        {transactions && transactions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th style={{width: '100px'}}>Data</th>
                <th>Valor</th>
                <th>Descrição</th>
                <th>Notas</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr>
                  <td>{transaction.booking_date}</td>
                  <td>{transaction.bank_transaction_code.code === 'TOPUP' ? '' : '-'}{transaction.transaction_amount.amount} €</td>
                  <td>{transaction.creditor.name}</td>
                  <td>{transaction.remittance_information.map((info) => info.description).join(', ')}</td>
                  <td>{transaction.bank_transaction_code.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          code ? (
            <div>
              <p>Não foram encontradas transações para a conta EnableBanking.</p>
              <a href={authUrl} className="c-button">Autenticar novamente</a>
            </div>
              
          ) : (
            <a href={authUrl} className="c-button">Autorizar Conta EnableBanking</a>
          )
        )}
        
      </main>
    </>
  )
}
