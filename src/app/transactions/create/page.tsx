import Header from '@/components/Header'
import TransactionForm from '@/components/TransactionForm'
import type { TransactionFormValues } from '@/components/TransactionForm'
import CreateTransactionTabs from '@/components/_pages/transactions/create/CreateTransactionTabs'
import fetchTransaction from '@/api/fetchTransaction'

interface CreateTransactionProps {
  searchParams: Promise<{ duplicate?: string }>
}

export default async function CreateTransaction({ searchParams }: CreateTransactionProps) {
  const { duplicate } = await searchParams

  if (!duplicate) {
    return (
      <>
        <Header>Adicionar movimentos</Header>

        <main className="l-container u-padding-block">
          <CreateTransactionTabs />
        </main>
      </>
    )
  }

  const { data: transaction, error } = await fetchTransaction(duplicate)

  if (error || !transaction) {
    return (
      <>
        <Header>Duplicar movimento</Header>

        <main className="l-container u-padding-block">
          <p>{error || 'Movimento não encontrado.'}</p>
        </main>
      </>
    )
  }

  const initialValues: TransactionFormValues = {
    date: transaction.date.split('T')[0].split(' ')[0],
    // The value is intentionally not duplicated: it changes on each occurrence
    niceDescription: transaction.niceDescription,
    description: transaction.description || '',
    notes: transaction.notes || '',
    subCategory: transaction.subCategory?.$id,
  }

  return (
    <>
      <Header>Duplicar movimento</Header>

      <main className="l-container u-padding-block">
        <TransactionForm
          initialValues={initialValues}
          initialSubCategory={transaction.subCategory}
          redirectTo="/"
        />
      </main>
    </>
  )
}
