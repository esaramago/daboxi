'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ConfirmPopup from '@/components/ConfirmPopup'
import discardEnableBankingTransaction from '@/api/discardEnableBankingTransaction'

const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })

interface DiscardTransactionButtonProps {
  enableBankingId: string
}

export default function DiscardTransactionButton({ enableBankingId }: DiscardTransactionButtonProps) {
  const router = useRouter()

  const handleDiscard = async () => {
    try {
      const { error } = await discardEnableBankingTransaction(enableBankingId)
      if (error) {
        alert('Não foi possível descartar o movimento')
        console.error(error)
        return
      }
      router.push('/enablebanking/transactions')
    } catch (err: any) {
      alert('Não foi possível descartar o movimento')
      console.error(err?.message || err)
    }
  }

  return (
    <ConfirmPopup
      title="Descartar movimento"
      message="Tem a certeza que deseja descartar este movimento?"
      confirmLabel="Descartar"
      cancelLabel="Cancelar"
      confirmVariant="danger"
      onConfirm={handleDiscard}
    >
      <WaButton variant="danger" type="button">
        Descartar
      </WaButton>
    </ConfirmPopup>
  )
}

