'use client'

import getColorByVariant from '@/utils/getColorByVariant'
import type { Variant } from '@/utils/getColorByVariant'
import dynamic from 'next/dynamic'
const SlIcon = dynamic(() => import('@shoelace-style/shoelace/dist/react/icon'), {ssr: false})

interface Props {
  name?: string
  variant?: string
  size?: 'small'
}

export default function Button(props: Props) {

  const color = getColorByVariant(props.variant as Variant)
  const bgColor = color.replace('-500', '-100').replace('-600', '-200')

  return (
    <div
      className={`c-icon ${props.size ? `c-icon--${props.size}` : ''}`}
      style={{backgroundColor: bgColor || 'var(--sl-color-neutral-100)', color: color || 'var(--sl-color-neutral-500)'}}
    >
      <SlIcon name={props.name || 'question-lg'}></SlIcon>
    </div>
  )
}