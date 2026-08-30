import Header from '@/components/Header'
import Loading from '@/components/Loading'

export default function EnableBankingTransactionLoading() {
  return (
    <>
      <Header route="/enablebanking/transactions">Adicionar movimento</Header>

      <main className="l-container u-padding-block">
        <Loading />
      </main>
    </>
  )
}

