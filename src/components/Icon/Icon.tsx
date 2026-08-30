'use client'

import getColorByVariant from '@/utils/getColorByVariant'
import type { Variant } from '@/utils/getColorByVariant'
import dynamic from 'next/dynamic'
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), {ssr: false})

interface Props {
  name?: string
  variant?: string
  size?: 'small'
}

export default function Button(props: Props) {

  const color = getColorByVariant(props.variant as Variant)
  const bgColor = color.replace('-50', '-80')

  return (
    <div
      className={`c-icon ${props.size ? `c-icon--${props.size}` : ''}`}
      style={{backgroundColor: bgColor || 'var(--wa-color-neutral-10)', color: color || 'var(--wa-color-neutral-50)'}}
    >
      <WaIcon name={props.name || 'question-lg'}></WaIcon>
    </div>
  )
}