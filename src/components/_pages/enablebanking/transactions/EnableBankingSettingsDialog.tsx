'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import saveEnableBankingSettings from '@/api/saveEnableBankingSettings'
import type WaInputElement from '@webawesome/input/input.js'

const WaDialog = dynamic(() => import('@awesome.me/webawesome/dist/react/dialog/index.js'), { ssr: false })
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), { ssr: false })
const WaSwitch = dynamic(() => import('@awesome.me/webawesome/dist/react/switch/index.js'), { ssr: false })

const DEFAULT_DIALOG_ID = 'enablebanking-settings-dialog'

interface Props {
  id?: string
  isOpen?: boolean
  onClose?: () => void
  initialBankName?: string | null
  initialCountry?: string | null
  initialEnabled?: boolean
}

export default function EnableBankingSettingsDialog({
  id = DEFAULT_DIALOG_ID,
  isOpen,
  onClose,
  initialBankName,
  initialCountry,
  initialEnabled,
}: Props) {
  const router = useRouter()
  const dialogRef = useRef<any>(null)

  const defaultEnabled = initialEnabled ?? Boolean(initialBankName && initialCountry)
  const [enabled, setEnabled] = useState(defaultEnabled)
  const [bankName, setBankName] = useState(initialBankName || '')
  const [country, setCountry] = useState(initialCountry || 'PT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEnabled(initialEnabled ?? Boolean(initialBankName && initialCountry))
    setBankName(initialBankName || '')
    setCountry(initialCountry || 'PT')
  }, [initialBankName, initialCountry, initialEnabled])

  useEffect(() => {
    if (dialogRef.current && typeof isOpen === 'boolean') {
      dialogRef.current.open = isOpen
    }
  }, [isOpen])

  const syncFormWithProps = () => {
    setError(null)
    setEnabled(initialEnabled ?? Boolean(initialBankName && initialCountry))
    setBankName(initialBankName || '')
    setCountry(initialCountry || 'PT')
  }

  const handleClose = () => {
    setError(null)
    if (dialogRef.current && dialogRef.current.open) {
      dialogRef.current.open = false
    }
    onClose?.()
  }

  const handleSave = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const trimmedBank = bankName.trim()
    const trimmedCountry = country.trim().toUpperCase()

    if (enabled) {
      if (!trimmedBank || !trimmedCountry) {
        setError('Por favor preencha todos os campos.')
        return
      }

      if (!/^[a-zA-Z0-9]+$/.test(trimmedBank)) {
        setError('O nome do banco não pode ter espaços nem caracteres especiais.')
        return
      }

      if (!/^[A-Z]{2}$/.test(trimmedCountry)) {
        setError('O código do país só pode ter 2 letras.')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await saveEnableBankingSettings({
        enabled,
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
    <WaDialog
      id={id}
      ref={dialogRef}
      label="Configurações EnableBanking"
      lightDismiss
      onWaShow={syncFormWithProps}
      onWaHide={handleClose}
    >
      <div className="l-stack">
        <WaSwitch
          checked={enabled}
          onChange={(e: any) => {
            const isChecked = e.target.checked ?? !enabled
            setEnabled(isChecked)
            if (error) setError(null)
          }}
        >
          Ativar EnableBanking
        </WaSwitch>

        {enabled && (
          <>
            <div className="l-stack l-stack--x-small">
              <WaInput
                label="Nome do banco"
                placeholder="Ex: Revolut, CaixaGeralDepositos, etc"
                value={bankName}
                pattern="^[a-zA-Z0-9]+$"
                onInput={(e: any) => {
                  setBankName(e.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter') handleSave(e)
                }}
                required={enabled}
                autoFocus={enabled}
              ></WaInput>
              <p className="u-text-small">Se tiver dúvidas qual o nome exato, pesquise-o na <a href="https://enablebanking.com/open-banking-apis" target="_blank">documentação do EnableBanking</a>.</p>
            </div>

            <WaInput
              label="País (código)"
              placeholder="Ex: PT, ES, GB"
              value={country}
              maxlength={2}
              pattern="^[a-zA-Z]{2}$"
              disabled={!enabled}
              onInput={event => {
                setCountry((event.target as WaInputElement).value.toUpperCase())
                if (error) setError(null)
              }}
              onKeyDown={(e: any) => {
                if (e.key === 'Enter') handleSave(e)
              }}
              required={enabled}
            ></WaInput>

            <p className="u-text-small">
              {enabled
                ? 'Ao guardar estas alterações, a sessão bancária atual será terminada e será necessário voltar a autenticar.'
                : 'Ao desativar a integração, a sessão bancária atual será terminada.'}
            </p>

            {error && (
              <p className="u-color-danger" role="alert" style={{ fontSize: 'var(--wa-font-size-s)' }}>
                {error}
              </p>
            )}
          </>
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
  )
}
