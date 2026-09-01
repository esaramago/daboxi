import Header from '@/components/Header'
import { redirect } from 'next/navigation'

interface CallbackProps {
  searchParams: Promise<{ code?: string; state?: string; error?: string }>
}

export default async function Callback({ searchParams }: CallbackProps) {

  const params = await searchParams
  const code = params?.code
  const error = params?.error

  if (code) {
    redirect(`/enablebanking/transactions?code=${code}`)
  }

  return (
    <>
      <Header>Movimentos bancários EnableBanking</Header>

      <main className="l-container l-stack u-padding-block">
        {error && <p>Erro na autorização: {error}</p>}
        {code && <p>Código de autorização recebido. A redirecionar...</p>}
        {!code && !error && <p>Nenhum código recebido.</p>}
      </main>
    </>
  )
}

