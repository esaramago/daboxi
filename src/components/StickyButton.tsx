'use client'

import './StickyButton.css'
import SlButton from '@shoelace-style/shoelace/dist/react/button'
import SlIcon from '@shoelace-style/shoelace/dist/react/icon'

interface Props {
  icon: string
  label: string
}

export default function StickyButton(props: Props) {

  return (
    <div className="c-sticky-button">
      <SlButton variant="primary" circle size="large">
        <SlIcon name={props.icon} label={props.label} style={{fontSize: 'var(--sl-font-size-2x-large)'}}></SlIcon>
      </SlButton>
    </div>
  )
}