import Header from '@/components/Header'
import getEnableBankingTransactions from '@/utils/enablebanking/getTransactions'
import getEnableBankingToken from '@/utils/enablebanking/getToken'
import fetchActiveBankSession from '@/api/fetchActiveBankSession'
import fetchExistingEnableBankingIds from '@/api/fetchExistingEnableBankingIds'
import fetchEnableBankingSettings from '@/api/fetchEnableBankingSettings'
import Date from '@/components/Date'
import EnableBankingTransaction from '@/components/_pages/enablebanking/transactions/EnableBankingTransaction'
import EnableBankingSettingsDialog from '@/components/_pages/enablebanking/transactions/EnableBankingSettingsDialog'
import EmptyState from '@/components/EmptyState'
import '@webawesome/button'
import '@webawesome/icon/icon.js'
import '@webawesome/card/card.js'

const SETTINGS_DIALOG_ID = 'enablebanking-settings-dialog'

export default async function EnableBankingTransactions({
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams
  const errorParam = sp?.error as string | undefined
  const token = getEnableBankingToken()

  let errorMessage: string | null = null
  if (errorParam) {
    switch (errorParam) {
      case 'invalid_state':
        errorMessage = 'Falha na verificação de segurança (CSRF) ou a sessão de autorização expirou. Por favor, tente novamente.'
        break
      case 'missing_code':
        errorMessage = 'Não foi recebido nenhum código de autorização do banco.'
        break
      case 'auth_link_failed':
        errorMessage = 'Não foi possível gerar a ligação de autenticação com o EnableBanking.'
        break
      case 'session_creation_failed':
        errorMessage = 'Não foi possível estabelecer sessão com o banco. O código pode ter expirado.'
        break
      case 'not_configured':
        errorMessage = 'Banco ou país não configurados.'
        break
      default:
        errorMessage = `Erro na autorização: ${decodeURIComponent(errorParam)}`
    }
  }

  // 1. Obter configurações de banco e país do utilizador
  const { data: settings } = await fetchEnableBankingSettings()
  const bankName = settings?.bankName || null
  const country = settings?.country || null
  const isEnabled = settings?.enabled ?? false
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
  }

  // 3. Buscar transações e IDs existentes em paralelo se tivermos uma sessão válida
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

  // 4. Filtrar transações que já foram importadas ou descartadas
  const filteredTransactions = transactions.filter(
    (transaction: any) =>
      !existingIds.has(transaction.transaction_id) &&
      (!transaction.entry_reference || !existingIds.has(transaction.entry_reference))
  )

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
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--wa-border-radius-m, 8px)',
              backgroundColor: 'var(--wa-color-danger-50, #fef2f2)',
              color: 'var(--wa-color-danger-800, #991b1b)',
              border: '1px solid var(--wa-color-danger-200, #fecaca)',
              marginBottom: '1rem',
              fontSize: 'var(--wa-font-size-s, 0.875rem)',
            }}
          >
            {errorMessage}
          </div>
        )}

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
                <p>A integração com o <a href="https://enablebanking.com" target="_blank">EnableBanking</a> está desativada.</p>
                <p>Para importar os seus movimentos bancários, configure a integração com o EnableBanking e autentique a sua conta.</p>
                
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
                <div>
                  <wa-button href="/api/enablebanking/auth">Autenticar EnableBanking ({bankName})</wa-button>
                </div>
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
