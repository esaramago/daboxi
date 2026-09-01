'use client'

import { useState, useId, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import saveEnableBankingSettings from '@/api/saveEnableBankingSettings'

const WaDialog = dynamic(() => import('@awesome.me/webawesome/dist/react/dialog/index.js'), { ssr: false })
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), { ssr: false })
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), { ssr: false })

interface Props {
  initialBankName?: string | null
  initialCountry?: string | null
  trigger?: React.ReactNode
}

export default function EnableBankingSettingsDialog({
  initialBankName,
  initialCountry,
  trigger,
}: Props) {
  const router = useRouter()
  const generatedId = useId().replace(/:/g, '')
  const dialogId = `dialog-settings-${generatedId}`
  const dialogRef = useRef<any>(null)

  const [bankName, setBankName] = useState(initialBankName || '')
  const [country, setCountry] = useState(initialCountry || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setBankName(initialBankName || '')
    setCountry(initialCountry || '')
  }, [initialBankName, initialCountry])

  const handleOpen = () => {
    setError(null)
    setBankName(initialBankName || '')
    setCountry(initialCountry || '')
    if (dialogRef.current) {
      dialogRef.current.open = true
    }
  }

  const handleClose = () => {
    setError(null)
    if (dialogRef.current) {
      dialogRef.current.open = false
    }
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const trimmedBank = bankName.trim()
    const trimmedCountry = country.trim().toUpperCase()

    if (!trimmedBank || !trimmedCountry) {
      setError('Por favor preencha todos os campos.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await saveEnableBankingSettings({
        bankName: trimmedBank,
        country: trimmedCountry,
      })

      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Erro ao guardar configurações')
        return
      }

      handleClose()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Erro inesperado ao guardar configurações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {trigger ? (
        trigger
      ) : (
        <WaButton
          type="button"
          title="Configurações EnableBanking"
          aria-label="Configurações EnableBanking"
          appearance="plain"
          data-dialog={`open ${dialogId}`}
          onClick={handleOpen}
        >
          <WaIcon name="gear" label="Configurações EnableBanking"></WaIcon>
        </WaButton>
      )}

      <WaDialog
        id={dialogId}
        ref={dialogRef}
        label="Configurações EnableBanking"
        lightDismiss
        onWaHide={() => setError(null)}
      >
        <div className="l-stack">
          <div className="l-stack l-stack--x-small">
            <WaInput
              label="Nome do banco"
              placeholder="Ex: Revolut, CaixaGeralDepositos, etc"
              value={bankName}
              onInput={(e: any) => setBankName(e.target.value)}
              required
              autoFocus
            ></WaInput>
            <p className="u-text-small">Se tiver dúvidas qual o nome exato, pesquise-o na <a href="https://enablebanking.com/open-banking-apis" target="_blank">documentação do EnableBanking</a>.</p>
          </div>

          <WaInput
            label="País (código)"
            placeholder="Ex: PT, ES, GB"
            value={country || 'PT'}
            onInput={(e: any) => setCountry(e.target.value)}
            required
          ></WaInput>

          <p className="u-text-small">
            Ao guardar estas alterações, a sessão bancária atual será terminada e será necessário voltar a autenticar.
          </p>

          {error && (
            <p className="u-color-danger" style={{ fontSize: 'var(--wa-font-size-s)' }}>
              {error}
            </p>
          )}
        </div>

        <div slot="footer" className="l-row l-row--small l-row--end">
          <WaButton
            appearance="outlined"
            data-dialog="close"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </WaButton>
          <WaButton
            variant="brand"
            onClick={handleSave}
            loading={loading}
          >
            Guardar
          </WaButton>
        </div>
      </WaDialog>
    </>
  )
}
