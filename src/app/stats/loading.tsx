import Header from '@/components/Header'
import Loading from '@/components/Loading'

export default function StatsLoading() {
  return (
    <>
      <Header route="/">Estatísticas</Header>

      <main className="l-container l-stack u-padding-block">
        <Loading />
      </main>
    </>
  )
}

