'use client'

import getColorByVariant from '@/utils/getColorByVariant'
import type { Variant } from '@/utils/getColorByVariant'
import dynamic from 'next/dynamic'
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), {ssr: false})

interface Props {
  name?: string
  variant?: string
  size?: 'small' | 's' | 'l' | 'xl' | '2xl' | '3xl'
  className?: string
}

export default function Button(props: Props) {

  const color = getColorByVariant(props.variant as Variant)
  const bgColor = color.replace('-50', '-80')

  if (props.size === 'small') {
    props.size = 's'
  }
  const fontSize = props.size ? `var(--wa-font-size-${props.size})` : ''

  return (
    <div
      className={`c-icon ${props.className || ''}`}
      style={{backgroundColor: bgColor || 'var(--wa-color-neutral-10)', color: color || 'var(--wa-color-neutral-50)'}}
    >
      <WaIcon name={props.name || 'question'} style={{fontSize: fontSize || null}}></WaIcon>
    </div>
  )
}