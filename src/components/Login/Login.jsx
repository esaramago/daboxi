'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Grid from '@/components/Grid/Grid'
import { login } from '@/lib/pocketbaseServer'
import dynamic from 'next/dynamic'

const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), { ssr: false })
const WaCard = dynamic(() => import('@awesome.me/webawesome/dist/react/card/index.js'), { ssr: false })

export default function Login() {
  const router = useRouter()
  const [formFields, setFormFields] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (event) => {
    let { name, value } = event.target

    setFormFields({ ...formFields, [name]: value })
  }

  const handleSubmitLogin = async (event) => {
    event.preventDefault()
    setLoading(true)

    // Criar sessão com PocketBase
    const { error } = await login(formFields.email, formFields.password)

    if (error) {
      setLoading(false)
      alert(typeof error === 'string' ? error : error?.message || 'Erro ao iniciar sessão')
    } else {
      // Redirect to home
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="c-login">
      <Grid direction="column" align="center" justify="center" gap="l">
        <Grid direction="column" align="center" justify="center" gap="s">
          <Image
            src="/logo.svg"
            width={240}
            height={50}
            alt="Logo Daboxi"
          />
          <p>Gere as tuas finanças de forma simples e segura.</p>
        </Grid>
        <WaCard style={{ maxWidth: '400px', width: '100%' }}>
            <form
              onSubmit={handleSubmitLogin}
              className="l-stack l-stack--large"
            >
              <WaInput
                onChange={handleInputChange}
                value={formFields.email}
                label="Email"
                placeholder="Email"
                type="email"
                id="email"
                name="email"
              />
              <WaInput
                onChange={handleInputChange}
                value={formFields.password}
                placeholder="Palavra-passe"
                type="password"
                id="password"
                name="password"
                label="Palavra-passe"
              />
              <Grid direction="column"  gap="s">
                <WaButton type="submit" disabled={loading} variant="brand">
                  {loading ? 'A entrar...' : 'Entrar'}
                </WaButton>
                <div className="u-text-center">
                  <Link href="/forgot-password" className="u-text-small">
                    Recuperar palavra-passe
                  </Link>
                </div>
              </Grid>
            </form>
        </WaCard>
        <p className="u-text-small">Atualmente, o Daboxi está em beta. O registo está apenas disponível <a href="mailto:daboxi@emanuelsaramago.com">por convite</a>.</p>
      </Grid>
    </div>
  )
}