'use client'

import { useState, useId, useRef } from 'react'
import dynamic from 'next/dynamic'

const WaDialog = dynamic(() => import('@awesome.me/webawesome/dist/react/dialog/index.js'), { ssr: false })
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })

export interface ConfirmPopupProps {
  id?: string
  children?: React.ReactNode
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'brand' | 'danger' | 'neutral' | 'success' | 'warning'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  disabled?: boolean
}

export default function ConfirmPopup({
  id,
  children,
  title = 'Confirmação',
  message = 'Tem a certeza que deseja prosseguir?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'brand',
  onConfirm,
  onCancel,
  disabled = false,
}: ConfirmPopupProps) {
  const generatedId = useId().replace(/:/g, '')
  const dialogId = id || `dialog-${generatedId}`
  const dialogRef = useRef<any>(null)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      await onConfirm()
      if (dialogRef.current) {
        dialogRef.current.open = false
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {children && (
        <span data-dialog={disabled ? undefined : `open ${dialogId}`} style={{ display: 'contents' }}>
          {children}
        </span>
      )}

      <WaDialog
        id={dialogId}
        ref={dialogRef}
        label={title}
        lightDismiss
        onWaHide={onCancel}
      >
        <p>{message}</p>
        <div slot="footer" className="l-row l-row--small" style={{ justifyContent: 'flex-end' }}>
          <WaButton
            appearance="outlined"
            data-dialog="close"
            disabled={loading}
          >
            {cancelLabel}
          </WaButton>
          <WaButton
            variant={confirmVariant}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </WaButton>
        </div>
      </WaDialog>
    </>
  )
}



