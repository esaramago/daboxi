import Header from '@/components/Header'
import Loading from '@/components/Loading'

export default function TransactionsLoading() {
  return (
    <>
      <Header>Todos os movimentos</Header>

      <main className="l-container l-stack u-padding-block">
        <Loading />
      </main>
    </>
  )
}

