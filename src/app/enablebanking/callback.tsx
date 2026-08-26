import Header from '@/components/Header'

export default function Callback() {

  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (code) {
    alert('TODO: Pegar o token')
  }

  return (
    <>
      <Header>Transações EnableBanking</Header>

      <main className="l-container l-stack u-padding-block">
        A redirecionar...
      </main>
    </>
  )
}
