import Header from '@/components/Header'
import Loading from '@/components/Loading'

export default function CreateTransactionLoading() {
  return (
    <>
      <Header>Adicionar movimentos</Header>

      <main className="l-container u-padding-block">
        <Loading />
      </main>
    </>
  )
}

