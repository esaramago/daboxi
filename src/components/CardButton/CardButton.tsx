'use client'

import Icon from '@/components/Icon'

interface Props {
  icon?: string
  variant?: string
  size?: 'small'

  description?: string
  subDescription?: string
  right?: any
}

export default function Button(props: Props) {

  return (
    <>
      <div className={`c-card-button ${props.size || ''}`}>
        <div className="c-card-button__left">
          <Icon
            size={props.size}
            variant={props.variant}
            name={props.icon}
          />
          <span>
            {props.description}<br/>
            <span className="c-card-button__sub-description">{props.subDescription}</span>
          </span>
        </div>
        <div className="c-card-button__right" style={{color: props.variant === 'income' ? 'var(--sl-color-success-500)' : ''}}>{props.right}</div>
      </div>
    </>
  )
}