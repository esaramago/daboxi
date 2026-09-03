'use client'

import '@awesome.me/webawesome/dist/components/button/button.js'

import type { ComponentPropsWithoutRef, ReactNode, MouseEventHandler, MouseEvent as ReactMouseEvent, Ref } from 'react'
import type WaButtonElement from '@awesome.me/webawesome/dist/components/button/button.js'

type WaButtonCustomProps = ComponentPropsWithoutRef<'wa-button'>

export interface WaButtonProps extends Omit<WaButtonCustomProps, 'children' | 'onClick' | 'ref'> {
  label?: string
  children?: ReactNode
  onClick?: MouseEventHandler<HTMLElement> | ((event: MouseEvent) => void)
  ref?: Ref<WaButtonElement>
}
export type Props = WaButtonProps

export function WaButton({ label, children, ref, ...props }: WaButtonProps) {
  return (
    <wa-button ref={ref as any} {...(props as WaButtonCustomProps)}>
      {children ?? label}
    </wa-button>
  )
}
export default WaButton