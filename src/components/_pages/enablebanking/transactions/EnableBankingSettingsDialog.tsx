'use client'

import { useState, useRef, useEffect, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import saveEnableBankingSettings from '@/api/saveEnableBankingSettings'
import fetchEnableBankingBanks from '@/api/fetchEnableBankingBanks'
import Loading from '@/components/Loading'
import type { EnableBankingAspsp } from '@/utils/enablebanking/getAspsps'
import type WaInputElement from '@webawesome/input/input.js'

const WaDialog = dynamic(() => import('@awesome.me/webawesome/dist/react/dialog/index.js'), { ssr: false })
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), { ssr: false })
const WaSelect = dynamic(() => import('@awesome.me/webawesome/dist/react/select/index.js'), { ssr: false })
const WaOption = dynamic(() => import('@awesome.me/webawesome/dist/react/option/index.js'), { ssr: false })
const WaSwitch = dynamic(() => import('@awesome.me/webawesome/dist/react/switch/index.js'), { ssr: false })

const DEFAULT_DIALOG_ID = 'enablebanking-settings-dialog'

interface Props {
  id?: string
  isOpen?: boolean
  onClose?: () => void
  initialBankName?: string | null
  initialCountry?: string | null
  initialEnabled?: boolean
  initialBanks?: EnableBankingAspsp[]
}

export default function EnableBankingSettingsDialog({
  id = DEFAULT_DIALOG_ID,
  isOpen,
  onClose,
  initialBankName,
  initialCountry,
  initialEnabled,
  initialBanks,
}: Props) {
  const router = useRouter()
  const dialogRef = useRef<any>(null)
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const defaultEnabled = initialEnabled ?? false
  const [enabled, setEnabled] = useState(defaultEnabled)
  const [bankName, setBankName] = useState(initialBankName || '')
  const [country, setCountry] = useState(initialCountry || 'PT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banks, setBanks] = useState<EnableBankingAspsp[]>(initialBanks || [])
  const [loadingBanks, setLoadingBanks] = useState(false)

  useEffect(() => {
    if (!isPending && isRefreshing) {
      setIsRefreshing(false)
    }
  }, [isPending, isRefreshing])

  useEffect(() => {
    if (isRefreshing) {
      const timeout = setTimeout(() => {
        setIsRefreshing(false)
      }, 10000)
      return () => clearTimeout(timeout)
    }
  }, [isRefreshing])

  useEffect(() => {
    setEnabled(initialEnabled ?? false)
    setBankName(initialBankName || '')
    setCountry(initialCountry || 'PT')
  }, [initialBankName, initialCountry, initialEnabled])

  useEffect(() => {
    if (initialBanks && initialBanks.length > 0) {
      setBanks(initialBanks)
    }
  }, [initialBanks])

  useEffect(() => {
    if (banks.length === 0) {
      setLoadingBanks(true)
      fetchEnableBankingBanks()
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setBanks(res.data)
          }
        })
        .catch((err) => {
          console.error('[EnableBanking] Erro ao carregar bancos:', err)
        })
        .finally(() => {
          setLoadingBanks(false)
        })
    }
  }, [banks.length])

  useEffect(() => {
    if (dialogRef.current && typeof isOpen === 'boolean') {
      dialogRef.current.open = isOpen
    }
  }, [isOpen])

  const filteredBanks = useMemo(() => {
    const trimmedCountry = country.trim().toUpperCase()
    if (!trimmedCountry) return banks
    return banks.filter((b) => b.country?.toUpperCase() === trimmedCountry)
  }, [banks, country])

  const sortedBanks = useMemo(() => {
    const uniqueMap = new Map<string, EnableBankingAspsp>()
    for (const bank of filteredBanks) {
      if (!uniqueMap.has(bank.name)) {
        uniqueMap.set(bank.name, bank)
      }
    }
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const nameA = a.title || a.name
      const nameB = b.title || b.name
      return nameA.localeCompare(nameB)
    })
  }, [filteredBanks])

  const syncFormWithProps = () => {
    setError(null)
    setEnabled(initialEnabled ?? false)
    setBankName(initialBankName || '')
    setCountry(initialCountry || 'PT')
    if (banks.length === 0) {
      setLoadingBanks(true)
      fetchEnableBankingBanks()
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setBanks(res.data)
          }
        })
        .catch((err) => {
          console.error('[EnableBanking] Erro ao carregar bancos:', err)
        })
        .finally(() => {
          setLoadingBanks(false)
        })
    }
  }

  const handleDialogShow = (e: any) => {
    if (e.target !== dialogRef.current) return
    syncFormWithProps()
  }

  const handleDialogHide = (e: any) => {
    if (e.target !== dialogRef.current) return
    handleClose()
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

    const trimmedCountry = country.trim().toUpperCase()

    if (enabled) {
      if (!bankName || !trimmedCountry) {
        setError('Por favor preencha todos os campos.')
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
        bankName,
        country: trimmedCountry,
      })

      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Erro ao guardar configurações')
        return
      }

      handleClose()
      setIsRefreshing(true)
      startTransition(() => {
        router.refresh()
      })
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Erro inesperado ao guardar configurações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <WaDialog
        id={id}
        ref={dialogRef}
        label="Configurações EnableBanking"
        onWaShow={handleDialogShow}
        onWaHide={handleDialogHide}
      >
        <div className="l-stack">
          <WaSwitch
            checked={enabled}
            onChange={(e: any) => {
              const isChecked = typeof e.target.checked === 'boolean' ? e.target.checked : !enabled
              setEnabled(isChecked)
              if (error) setError(null)
            }}
          >
            Ativar EnableBanking
          </WaSwitch>

          {enabled && (
            <>
              <WaInput
                label="País (código)"
                placeholder="Ex: PT, ES, GB"
                value={country}
                maxlength={2}
                pattern="^[a-zA-Z]{2}$"
                disabled={!enabled}
                onInput={(event) => {
                  setCountry((event.target as WaInputElement).value.toUpperCase())
                  if (error) setError(null)
                }}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter') handleSave(e)
                }}
                required={enabled}
              ></WaInput>

              <WaSelect
                label="Nome do banco"
                placeholder={loadingBanks ? 'A carregar bancos...' : 'Selecione o banco'}
                value={bankName}
                disabled={!enabled || loadingBanks}
                required={enabled}
                onWaShow={(e: any) => e.stopPropagation()}
                onWaHide={(e: any) => e.stopPropagation()}
                onChange={(e: any) => {
                  setBankName(e.target.value)
                  if (error) setError(null)
                }}
                onInput={(e: any) => {
                  setBankName(e.target.value)
                  if (error) setError(null)
                }}
              >
                {bankName && !sortedBanks.some((b) => b.name === bankName) && (
                  <WaOption value={bankName}>{bankName}</WaOption>
                )}
                {sortedBanks.map((bank) => (
                  <WaOption key={bank.name} value={bank.name}>
                    {bank.title || bank.name}
                  </WaOption>
                ))}
                {sortedBanks.length === 0 && !loadingBanks && (
                  <WaOption disabled value="">
                    Nenhum banco encontrado para este país
                  </WaOption>
                )}
              </WaSelect>

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

      {(isRefreshing || isPending) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loading />
        </div>
      )}
    </>
  )
}
