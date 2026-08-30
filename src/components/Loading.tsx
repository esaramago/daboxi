'use client'

import './Loading.css'
import dynamic from 'next/dynamic'
const WaSpinner = dynamic(() => import('@awesome.me/webawesome/dist/react/spinner/index.js'), {ssr: false})

interface Props {
  size?: 'small'
}

export default function Loading(props: Props) {
  return (
    <div className={`c-loading ${props.size ? `c-loading--${props.size}` : ''}`}>
      <WaSpinner></WaSpinner>
    </div>
  )
}