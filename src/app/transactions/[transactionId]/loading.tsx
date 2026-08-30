import Header from '@/components/Header'
import Loading from '@/components/Loading'

export default function TransactionDetailLoading() {
  return (
    <>
      <Header>Movimento</Header>

      <main className="l-container u-padding-block">
        <Loading />
      </main>
    </>
  )
}

