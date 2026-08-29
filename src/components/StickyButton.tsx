'use client'

import './StickyButton.css'
import dynamic from 'next/dynamic'
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), { ssr: false })

interface Props {
  icon: string
  label: string
}

export default function StickyButton(props: Props) {

  return (
    <div className="c-sticky-button">
      <WaButton variant="brand" size="large">
        <WaIcon name={props.icon} label={props.label} style={{fontSize: 'var(--wa-font-size-2xl)'}}></WaIcon>
      </WaButton>
    </div>
  )
}