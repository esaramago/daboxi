'use client'
import './EmptyState.css'
import dynamic from 'next/dynamic'
const WaCallout = dynamic(() => import('@awesome.me/webawesome/dist/react/callout/index.js'), { ssr: false })
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), { ssr: false })

interface EmptyStateProps {
  children?: React.ReactNode,
  icon?: string,
  variant?: 'warning',
  size?: 'large',
}


export default function EmptyState(props: EmptyStateProps) {
  return (
    <WaCallout className="c-empty-state" size={props.size || 'large'} variant={props.variant || 'warning'}>
      <WaIcon name={props.icon || 'inbox'} slot="icon" />
      {props.children || 'Não existem dados disponíveis.'}
    </WaCallout>
  )
}
