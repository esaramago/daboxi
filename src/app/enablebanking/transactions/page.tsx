import Header from '@/components/Header'
import getEnableBankingAuthLink from '@/utils/enablebanking/getAuthLink'
import createEnableBankingSession from '@/utils/enablebanking/createSession'
import getEnableBankingTransactions from '@/utils/enablebanking/getTransactions'
import getEnableBankingToken from '@/utils/enablebanking/getToken'
import fetchActiveBankSession from '@/api/fetchActiveBankSession'
import fetchExistingEnableBankingIds from '@/api/fetchExistingEnableBankingIds'
import fetchEnableBankingSettings from '@/api/fetchEnableBankingSettings'
import saveBankSession from '@/api/saveBankSession'
import Date from '@/components/Date'
import EnableBankingTransaction from '@/components/_pages/enablebanking/transactions/EnableBankingTransaction'
import EnableBankingSettingsDialog from '@/components/_pages/enablebanking/transactions/EnableBankingSettingsDialog'
import EmptyState from '@/components/EmptyState'
import '@webawesome/button'
import '@awesome.me/webawesome/dist/components/icon/icon.js'

const SETTINGS_DIALOG_ID = 'enablebanking-settings-dialog'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''

export default async function EnableBankingTransactions({
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams
  const code = sp?.code as string | undefined
  const token = getEnableBankingToken()

  // 1. Obter configurações de banco e país do utilizador
  const { data: settings } = await fetchEnableBankingSettings()
  const bankName = settings?.bankName || null
  const country = settings?.country || null
  const isEnabled = settings?.enabled ?? Boolean(bankName && country)
  const isConfigured = Boolean(isEnabled && bankName && country)

  let sessionId: string | null = null
  let session: any = null
  let transactions: any[] = []

  // 2. Obter sessão ativa na base de dados para o banco configurado
  if (isConfigured && bankName) {
    session = await fetchActiveBankSession(bankName)
    if (!session.error && session.data?.sessionId) {
      sessionId = session.data.sessionId
    }

    // 3. Se não houver sessão ativa na BD mas houver um novo 'code' e configurações válidas
    if (!sessionId && code && country) {
      sessionId = await createEnableBankingSession(code, token)
      if (sessionId) {
        await saveBankSession({
          sessionId,
          bankName,
          country,
          status: 'AUTHORIZED',
        })
      }
    }
  }

  // 4. Buscar transações e IDs existentes em paralelo se tivermos uma sessão válida
  let existingIds = new Set<string>()

  if (sessionId) {
    const knownAccountId = session.data?.accounts?.[0] || null
    const [transactionsData, existingIdsResult] = await Promise.all([
      getEnableBankingTransactions(sessionId, token, knownAccountId),
      fetchExistingEnableBankingIds(),
    ])

    if (transactionsData === null) {
      // Sessão no EnableBanking inválida ou expirada
      sessionId = null
      transactions = []
    } else {
      transactions = transactionsData
    }
    existingIds = new Set(existingIdsResult.data || [])
  } else {
    const existingIdsResult = await fetchExistingEnableBankingIds()
    existingIds = new Set(existingIdsResult.data || [])
  }

  // 5. Filtrar transações que já foram importadas ou descartadas
  const filteredTransactions = transactions.filter(
    (transaction: any) =>
      !existingIds.has(transaction.transaction_id) &&
      (!transaction.entry_reference || !existingIds.has(transaction.entry_reference))
  )

  // 6. Só gerar link de autenticação se não houver sessão ativa e estiver configurado
  let authUrl: string | null = null
  if (!sessionId && isConfigured && bankName && country) {
    authUrl = await getEnableBankingAuthLink(
      baseUrl + '/enablebanking/callback',
      token,
      bankName,
      country
    )
  }

  // 7. Agrupar transações por data
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
      <Header
        route="/"
        actions={
          <wa-button
            appearance="plain"
            data-dialog={`open ${SETTINGS_DIALOG_ID}`}
            title="Configurações EnableBanking"
            aria-label="Configurações EnableBanking"
          >
            <wa-icon name="gear" label="Configurações EnableBanking"></wa-icon>
          </wa-button>
        }
      >
        Movimentos bancários EnableBanking
      </Header>

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
            {!isEnabled ? (
              <EmptyState icon="building-columns">
                A integração com o EnableBanking está desativada.
                <div>
                  <wa-button type="button" data-dialog={`open ${SETTINGS_DIALOG_ID}`}>
                    Configurar EnableBanking
                  </wa-button>
                </div>
              </EmptyState>
            ) : !isConfigured ? (
              <EmptyState icon="building-columns">
                Indique o seu banco e respetivo país para aceder aos seus movimentos.
                <div>
                  <wa-button type="button" data-dialog={`open ${SETTINGS_DIALOG_ID}`}>
                    Configurar banco e país
                  </wa-button>
                </div>
              </EmptyState>
            ) : !sessionId ? (
              <EmptyState icon="key">
                A sessão bancária ({bankName}) não está ativa.
                {authUrl ? (
                  <div>
                    <wa-button href={authUrl}>Autenticar EnableBanking ({bankName})</wa-button>
                  </div>
                ) : (
                  <p className="u-color-danger" style={{ fontSize: 'var(--wa-font-size-s)', margin: 0 }}>
                    Não foi possível gerar a hiperligação de autenticação para {bankName}. Verifique as credenciais do EnableBanking.
                  </p>
                )}
              </EmptyState>
            ) : (
              <EmptyState icon="face-grin-stars">
                Parabéns! Todos os movimentos bancários já foram tratados!
              </EmptyState>
            )}
          </div>
        )}
      </main>

      <EnableBankingSettingsDialog
        initialBankName={bankName}
        initialCountry={country}
        initialEnabled={isEnabled}
      />
    </>
  )
}
