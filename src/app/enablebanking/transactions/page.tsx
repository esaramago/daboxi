import Header from '@/components/Header'
import getEnableBankingAuthLink from '@/utils/enablebanking/getAuthLink'
import createEnableBankingSession from '@/utils/enablebanking/createSession'
import getEnableBankingTransactions from '@/utils/enablebanking/getTransactions'
import getEnableBankingToken from '@/utils/enablebanking/getToken'
import fetchActiveBankSession from '@/api/fetchActiveBankSession'
import saveBankSession from '@/api/saveBankSession'
import Date from '@/components/Date'
import EnableBankingTransaction from '@/components/_pages/enablebanking/transactions/EnableBankingTransaction'

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
    authUrl = await getEnableBankingAuthLink(baseUrl + '/enablebanking/callback', token)
  }

  // 5. Group transactions by date
  interface TransactionGroup {
    date: string
    transactions: any[]
  }

  const transactionsByDate = transactions.reduce<Record<string, TransactionGroup>>((acc, transaction) => {
    const date = transaction.booking_date
    if (!acc[date]) {
      acc[date] = {
        date,
        transactions: [],
      }
    }
    acc[date].transactions.push(transaction)
    return acc
  }, {})

  return (
    <>
      <Header>Transações EnableBanking</Header>


      <main className="l-container u-padding-block">
        {transactions && transactions.length > 0 ? (
          <div className="l-stack">
            {
              transactionsByDate && Object.values(transactionsByDate).map((group) => (
                <div
                  key={group.date}
                >
                  <Date date={group.date} sticky={true}></Date>
                  {
                    group.transactions.map((transaction) => (
                      <EnableBankingTransaction
                        key={transaction.transaction_id}
                        id={transaction.transaction_id}
                        description={transaction.remittance_information?.[0] || ''}
                        subDescription={transaction.creditor?.name || transaction.debtor?.name}
                        code={transaction.bank_transaction_code?.code || ''}
                        value={Number(transaction.transaction_amount?.amount) || 0}
                      ></EnableBankingTransaction>
                    ))
                  }
                </div>
              ))
            }
          </div>
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

