'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { login } from '@/lib/appwrite'
import dynamic from 'next/dynamic'
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), { ssr: false })

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

    // Criar sessão com Appwrite
    const { error } = await login(formFields.email, formFields.password)

    if (error) {
      setLoading(false)
      alert(error.message)
    } else {
      // Redirect to home
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="c-login">
      <div className="l-stack l-stack--large">
        <div className="u-text-center">
          <Image
            src="/logo.svg"
            width={240}
            height={50}
            alt="Logo Daboxi"
          />
          </div>
        <form
          onSubmit={handleSubmitLogin}
          className="l-stack l-stack--small"
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
          <WaButton type="submit" disabled={loading} variant="brand">
            {loading ? 'A entrar...' : 'Entrar'}
          </WaButton>
        </form>
      </div>
    </div>
  )
}