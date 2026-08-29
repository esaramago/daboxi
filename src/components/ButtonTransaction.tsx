'use client'

import Link from 'next/link'
import CardButton from '@/components/CardButton'
import Value from '@/components/Value'
import getNetValue from '@/utils/getNetValue'
import { type Types } from '@/types/types'

export interface ButtonTransaction {
  id: string
  value: number
  netValue?: number
  icon?: string
  variant?: Types
  description?: string
  niceDescription?: string
  subCategoryDescription?: string
}

export default function ButtonTransaction(props: ButtonTransaction) {

  const netValue = getNetValue(props.netValue, props.variant)

  return (

    <Link
      href={`transactions/${props.id}`}
      key={props.id}
    >
      <CardButton
        icon={props.icon}
        variant={props.variant}

        description={props.niceDescription || props.description}
        subDescription={props.subCategoryDescription}
        right={
          <>
            <Value value={props.value} style={{color: props.value > 0 ? 'var(--sl-color-success-500)' : ''}}></Value>
            {
              (netValue != null) && <Value value={netValue} size="small"></Value>
            }
          </>
        }
      ></CardButton>
    </Link>
  )
}