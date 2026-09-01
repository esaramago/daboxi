import Header from '@/components/Header'
import Loading from '@/components/Loading'

export default function EnableBankingTransactionsLoading() {
  return (
    <>
      <Header route="/">Movimentos bancários EnableBanking</Header>

      <main className="l-container u-padding-block">
        <Loading />
      </main>
    </>
  )
}

