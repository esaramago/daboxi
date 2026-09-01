'use client'

import dynamic from 'next/dynamic'
const WaCallout = dynamic(() => import('@awesome.me/webawesome/dist/react/callout/index.js'), { ssr: false })
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), { ssr: false })

export default function EmptyState(props: { message?: string }) {
  return (
    <WaCallout size="large" variant="warning">
      <WaIcon name="inbox" slot="start" />
      {props.message || 'Não existem dados disponíveis.'}
    </WaCallout>
  )
}
