import Header from '@/components/Header'
import Loading from '@/components/Loading'

export default function CreateTransactionLoading() {
  return (
    <>
      <Header>Adicionar movimentos</Header>

      <main className="l-container l-container--wide u-padding-block">
        <Loading />
      </main>
    </>
  )
}

