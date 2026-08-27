import Header from '@/components/Header'
import getEnableBankingAuthLink from '@/utils/enablebanking/getAuthLink'
import createEnableBankingSession from '@/utils/enablebanking/createSession'
import getEnableBankingTransactions from '@/utils/enablebanking/getTransactions'
import getEnableBankingToken from '@/utils/enablebanking/getToken'
import fetchActiveBankSession from '@/api/fetchActiveBankSession'
import saveBankSession from '@/api/saveBankSession'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL

export default async function EnableBankingTransactions({
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams
  const code = sp?.code as string | undefined
  const token = getEnableBankingToken()

  let sessionId: string | null = null
  let transactions: any[] = []

  // 1. Obter sessão ativa na base de dados
  const session = await fetchActiveBankSession()
  if (!session.error && session.data?.sessionId) {
    sessionId = session.data.sessionId
  }

  // 2. Se não houver sessão ativa na BD mas houver um novo 'code'
  if (!sessionId && code) {
    sessionId = await createEnableBankingSession(code, token)
    if (sessionId) {
      await saveBankSession({
        sessionId,
        status: 'AUTHORIZED',
      })
    }
  }

  // 3. Buscar transações se tivermos uma sessão válida
  if (sessionId) {
    const transactionsData = await getEnableBankingTransactions(sessionId, token)
    transactions = transactionsData || []
  }

  // 4. Só gerar link de autenticação se não houver sessão ativa
  let authUrl: string | null = null
  if (!sessionId) {
    authUrl = await getEnableBankingAuthLink(`${baseUrl}/enablebanking/callback`, token)
  }

  return (
    <>
      <Header>Transações EnableBanking</Header>

      <main className="l-container l-container--wide u-padding-block">
        {transactions && transactions.length > 0 ? (
          <>
            <table className="c-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Data</th>
                  <th className="u-text-end">Valor</th>
                  <th>Descrição</th>
                  <th>Notas</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction: any, index: number) => (
                  <tr key={transaction.entry_reference || transaction.transaction_id || index}>
                    <td>{transaction.booking_date}</td>
                    <td className="u-text-end">
                      {transaction.bank_transaction_code?.code === 'TOPUP' ? '' : '-'}
                      {transaction.transaction_amount?.amount}
                    </td>
                    <td>{transaction.remittance_information[0]}</td>
                    <td>{transaction.creditor?.name || transaction.debtor?.name}</td>
                    <td>{transaction.bank_transaction_code?.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <textarea
              className="c-textarea"
              value={JSON.stringify(transactions, null, 2)}
              readOnly
            ></textarea>
          </>
        ) : (
          <div className="l-stack">
            <p>Não foram encontradas transações ou a sessão bancária não está ativa.</p>
            {authUrl && (
              <div>
                <a href={authUrl} className="c-button">
                  Autenticar EnableBanking
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}

