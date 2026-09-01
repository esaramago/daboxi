import Header from '@/components/Header'
import getEnableBankingAuthLink from '@/utils/enablebanking/getAuthLink'
import createEnableBankingSession from '@/utils/enablebanking/createSession'
import getEnableBankingTransactions from '@/utils/enablebanking/getTransactions'
import getEnableBankingToken from '@/utils/enablebanking/getToken'
import fetchActiveBankSession from '@/api/fetchActiveBankSession'
import fetchExistingEnableBankingIds from '@/api/fetchExistingEnableBankingIds'
import saveBankSession from '@/api/saveBankSession'
import Date from '@/components/Date'
import EnableBankingTransaction from '@/components/_pages/enablebanking/transactions/EnableBankingTransaction'
import EmptyState from '@/components/EmptyState'

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

  // 3. Buscar transações e IDs existentes em paralelo se tivermos uma sessão válida
  let existingIds = new Set<string>()

  if (sessionId) {
    const knownAccountId = session.data?.accounts?.[0] || null
    const [transactionsData, existingIdsResult] = await Promise.all([
      getEnableBankingTransactions(sessionId, token, knownAccountId),
      fetchExistingEnableBankingIds(),
    ])

    transactions = transactionsData || []
    existingIds = new Set(existingIdsResult.data || [])
  } else {
    const existingIdsResult = await fetchExistingEnableBankingIds()
    existingIds = new Set(existingIdsResult.data || [])
  }

  // 4. Filtrar transações que já foram importadas ou descartadas
  const filteredTransactions = transactions.filter(
    (transaction: any) =>
      !existingIds.has(transaction.transaction_id) &&
      (!transaction.entry_reference || !existingIds.has(transaction.entry_reference))
  )

  // 5. Só gerar link de autenticação se não houver sessão ativa
  let authUrl: string | null = null
  if (!sessionId) {
    authUrl = await getEnableBankingAuthLink(baseUrl + '/enablebanking/callback', token)
  }

  // 6. Agrupar transações por data
  interface TransactionGroup {
    date: string
    transactions: any[]
  }

  const transactionsByDate = filteredTransactions.reduce<Record<string, TransactionGroup>>((acc, transaction) => {
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
      <Header route="/">Movimentos bancários EnableBanking</Header>

      <main className="l-container u-padding-block">
        {filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="l-stack">
            {transactionsByDate &&
              Object.values(transactionsByDate).map((group) => (
                <div key={group.date}>
                  <Date date={group.date} sticky={true}></Date>
                  {group.transactions.map((transaction) => (
                    <EnableBankingTransaction
                      key={transaction.entry_reference}
                      id={transaction.entry_reference}
                      description={transaction.remittance_information?.[0] || ''}
                      subDescription={transaction.creditor?.name || transaction.debtor?.name}
                      code={transaction.bank_transaction_code?.code || ''}
                      value={Number(transaction.transaction_amount?.amount) || 0}
                    ></EnableBankingTransaction>
                  ))}
                </div>
              ))}
          </div>
        ) : (
            <div className="l-stack">
              {authUrl ? (
                <>
                  <p>A sessão bancária não está ativa.</p>
                  <a href={authUrl} className="c-button">
                    Autenticar EnableBanking
                  </a>
                </>
              ) : (
                <EmptyState message="Não existem transações bancárias disponíveis."></EmptyState>
              )
            }
            
          </div>
        )}
      </main>
    </>
  )
}
