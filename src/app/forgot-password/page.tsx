import { Suspense } from 'react'
import ForgotPassword from '@/components/ForgotPassword'
import Loading from '@/components/Loading'

export const metadata = {
  title: 'Recuperar palavra-passe - Daboxi',
}

export default function ForgotPasswordPage() {
  return (
    <main className="l-container l-stack l-stack--small">
      <Suspense fallback={<Loading />}>
        <ForgotPassword />
      </Suspense>
    </main>
  )
}

