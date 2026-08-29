
import CardButton from '@/components/CardButton'
import Value from '@/components/Value'

interface Props {
  id: string
  description: string
  subDescription?: string
  code: string
  value: number
}

export default async function EnableBankingTransaction(props: Props) {

  const isTopup = props.code === 'TOPUP'
  const color = isTopup ? 'var(--wa-color-success-50)' : ''
  const value = isTopup ? props.value : props.value*-1
  return (
    <button type="button" className="u-width-100">
      <CardButton
        key={props.id}
        description={props.description}
        subDescription={props.subDescription}
        right={
          <Value value={value} style={{color: color}}></Value>
        }
      ></CardButton>
    </button>
  )
}