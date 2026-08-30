import Header from '@/components/Header'
import Link from 'next/link'
import fetchEnableBankingTransaction from '@/api/fetchEnableBankingTransaction'
import TransactionForm from '@/components/TransactionForm'

interface EnableBankingCreateTransactionProps {
  params: Promise<{ transactionId: string }>
}

export default async function EnableBankingCreateTransaction({ params }: EnableBankingCreateTransactionProps) {
  const { transactionId } = await params
  const decodedTransactionId = decodeURIComponent(transactionId)

  const { data: transaction, error } = await fetchEnableBankingTransaction(decodedTransactionId)

  if (error || !transaction) {
    return (
      <>
        <Header>Adicionar movimento</Header>
        <main className="l-container u-padding-block">
          <div className="l-stack">
            <p>{error || 'Transação não encontrada ou sessão bancária inválida.'}</p>
            <div>
              <Link href="/enablebanking/transactions" className="c-button">
                Voltar às transações EnableBanking
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  // Pre-calculate initial form values
  const isTopup =
    transaction.bank_transaction_code?.code === 'TOPUP' || transaction.credit_debit_indicator === 'CRDT'
  const rawAmount = Math.abs(Number(transaction.transaction_amount?.amount) || 0)
  const value = isTopup ? rawAmount : -rawAmount

  const bookingDate = transaction.booking_date || transaction.value_date || ''
  const formattedDate = bookingDate ? bookingDate.split('T')[0] : ''

  const remittanceInfo = transaction.remittance_information?.[0] || ''
  const partyName = transaction.creditor?.name || transaction.debtor?.name || ''
  const niceDescription = remittanceInfo || partyName || ''
  const description = partyName || remittanceInfo || ''

  const initialValues = {
    date: formattedDate,
    value: value,
    niceDescription: niceDescription,
    description: description,
    enableBankingId: transaction.transaction_id || decodedTransactionId,
  }

  return (
    <>
      <Header>Adicionar movimento</Header>
      <main className="l-container u-padding-block">
        <TransactionForm
          initialValues={initialValues}
          redirectTo="/enablebanking/transactions"
        />
      </main>
    </>
  )
}

