'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ConfirmPopup from '@/components/ConfirmPopup'
import discardEnableBankingTransaction from '@/api/discardEnableBankingTransaction'

const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), { ssr: false })

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
      title="Ignorar movimento"
      message="Tem a certeza que deseja ignorar e eliminar este movimento?"
      confirmLabel="Ignorar"
      cancelLabel="Cancelar"
      confirmVariant="danger"
      onConfirm={handleDiscard}
    >
      <WaButton variant="danger" type="button">
        <WaIcon slot="start" name="trash"></WaIcon>
        Ignorar
      </WaButton>
    </ConfirmPopup>
  )
}

