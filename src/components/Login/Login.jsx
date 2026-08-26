'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { login } from '@/lib/appwrite'

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
          <div>
            <label htmlFor="email" className="c-label">Email</label>
            <input
              className="c-input"
              id="email"
              name="email"
              type="email"
              onInput={handleInputChange}
              />
          </div>
          <div>
            <label htmlFor="password" className="c-label">Palavra-passe</label>
            <input
              className="c-input"
              id="password"
              name="password"
              type="password"
              onInput={handleInputChange}
            />
          </div>
          <button className="c-button" type="submit" disabled={loading}>
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}