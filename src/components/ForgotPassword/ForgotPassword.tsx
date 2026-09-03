'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { requestPasswordReset, confirmPasswordReset } from '@/lib/pocketbaseServer'

const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), { ssr: false })

export default function ForgotPassword() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // Request password reset state
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Reset password state (when token is present)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isResetSuccess, setIsResetSuccess] = useState(false)

  // Common UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await requestPasswordReset(email)
      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Erro ao pedir recuperação de palavra-passe')
      } else {
        setIsSubmitted(true)
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao pedir recuperação de palavra-passe')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As palavras-passe não coincidem.')
      return
    }

    setLoading(true)

    try {
      const result = await confirmPasswordReset(token!, password, passwordConfirm)
      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Erro ao redefinir a palavra-passe')
      } else {
        setIsResetSuccess(true)
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao redefinir a palavra-passe')
    } finally {
      setLoading(false)
    }
  }

  // View: Password reset confirmed successfully
  if (isResetSuccess) {
    return (
      <div className="c-login">
        <div className="l-stack l-stack--large">
          <div className="u-text-center">
            <Link href="/login">
              <Image
                src="/logo.svg"
                width={240}
                height={50}
                alt="Logo Daboxi"
              />
            </Link>
          </div>

          <div className="l-stack l-stack--small u-text-center">
            <h2>Palavra-passe alterada!</h2>
            <p className="u-text-small">
              A tua palavra-passe foi atualizada com sucesso. Já podes iniciar sessão com a nova credencial.
            </p>
          </div>

          <div className="u-text-center">
            <Link href="/login">
              <WaButton variant="brand">
                Iniciar sessão
              </WaButton>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // View: Reset password form (token present in URL)
  if (token) {
    return (
      <div className="c-login">
        <div className="l-stack l-stack--large">
          <div className="u-text-center">
            <Link href="/login">
              <Image
                src="/logo.svg"
                width={240}
                height={50}
                alt="Logo Daboxi"
              />
            </Link>
          </div>

          <div className="l-stack l-stack--small u-text-center">
            <h2>Redefinir palavra-passe</h2>
            <p className="u-text-small">
              Define uma nova palavra-passe para a tua conta.
            </p>
          </div>

          <form onSubmit={handleConfirmReset} className="l-stack l-stack--large">
            <WaInput
              value={password}
              onInput={(e: any) => setPassword(e.target.value)}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="Nova palavra-passe"
              type="password"
              id="password"
              name="password"
              label="Nova palavra-passe"
              autocomplete="new-password"
              required
            />
            <WaInput
              value={passwordConfirm}
              onInput={(e: any) => setPasswordConfirm(e.target.value)}
              onChange={(e: any) => setPasswordConfirm(e.target.value)}
              placeholder="Confirmar palavra-passe"
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              label="Confirmar palavra-passe"
              autocomplete="new-password"
              required
            />

            {error && (
              <p className="u-color-danger u-text-small u-text-center">
                {error}
              </p>
            )}

            <WaButton type="submit" disabled={loading} variant="brand">
              {loading ? 'A guardar...' : 'Guardar nova palavra-passe'}
            </WaButton>

            <div className="u-text-center">
              <Link href="/login" className="c-link u-text-small">
                Voltar ao início de sessão
              </Link>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // View: Reset request sent (email submitted successfully)
  if (isSubmitted) {
    return (
      <div className="c-login">
        <div className="l-stack l-stack--large">
          <div className="u-text-center">
            <Link href="/login">
              <Image
                src="/logo.svg"
                width={240}
                height={50}
                alt="Logo Daboxi"
              />
            </Link>
          </div>

          <div className="l-stack l-stack--small u-text-center">
            <h2>Verifica o teu email</h2>
            <p className="u-text-small">
              Se existir uma conta associada a <strong>{email}</strong>, enviámos uma mensagem com instruções para redefinires a tua palavra-passe.
            </p>
            <p className="u-text-small">
              Verifica também a pasta de spam ou correio não solicitado.
            </p>
          </div>

          <div className="l-stack l-stack--small u-text-center">
            <Link href="/login">
              <WaButton variant="brand">
                Voltar ao início de sessão
              </WaButton>
            </Link>

            <div>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false)
                  setError(null)
                }}
                className="c-link u-text-small"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Tentar outro email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // View: Default request password reset form
  return (
    <div className="c-login">
      <div className="l-stack l-stack--large">
        <div className="u-text-center">
          <Link href="/login">
            <Image
              src="/logo.svg"
              width={240}
              height={50}
              alt="Logo Daboxi"
            />
          </Link>
        </div>

        <div className="l-stack l-stack--small u-text-center">
          <h2>Recuperar palavra-passe</h2>
          <p className="u-text-small">
            Insere o teu email para receberes instruções de recuperação.
          </p>
        </div>

        <form onSubmit={handleRequestReset} className="l-stack l-stack--large">
          <WaInput
            value={email}
            onInput={(e: any) => setEmail(e.target.value)}
            onChange={(e: any) => setEmail(e.target.value)}
            label="Email"
            placeholder="Email"
            type="email"
            id="email"
            name="email"
            autocomplete="email"
            required
            autoFocus
          />

          {error && (
            <p className="u-color-danger u-text-small u-text-center">
              {error}
            </p>
          )}

          <WaButton type="submit" disabled={loading} variant="brand">
            {loading ? 'A enviar...' : 'Recuperar palavra-passe'}
          </WaButton>

          <div className="u-text-center">
            <Link href="/login" className="c-link u-text-small">
              Voltar ao início de sessão
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
