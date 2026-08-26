import Header from '@/components/Header'

interface CallbackProps {
  searchParams: Promise<{ code?: string; state?: string; error?: string }>
}

export default async function Callback({ searchParams }: CallbackProps) {

  debugger
  const params = await searchParams
  const code = params?.code
  const error = params?.error

  return (
    <>
      <Header>Transações EnableBanking</Header>

      <main className="l-container l-stack u-padding-block">
        {error && <p>Erro na autorização: {error}</p>}
        {code && <p>Código de autorização recebido: {code}</p>}
        {!code && !error && <p>Nenhum código recebido.</p>}
      </main>
    </>
  )
}

