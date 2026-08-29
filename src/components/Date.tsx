'use client'

interface Props {
  date: string
  sticky?: boolean
  size?: 'small'
}

import './Date.css'
import dynamic from 'next/dynamic'
const WaFormatDate = dynamic(() => import('@awesome.me/webawesome/dist/react/format-date/index.js'), {ssr: false})

export default function Value(props: Props) {

  const showYear = new Date(props.date).getFullYear() !== new Date().getFullYear()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = new Date(props.date).getTime() === today.getTime()

  return (
    <div className={`c-date ${props.sticky ? 'c-date--sticky' : ''} ${props.size ? `c-date--${props.size}` : ''}`}>
      {
        isToday ? (
          <time dateTime={props.date}>Hoje</time>
        ) : (
          <WaFormatDate month="short" day="numeric" {...(showYear ? {year: 'numeric'} : {})} date={props.date}></WaFormatDate>
        )
      }

    </div>
  )
}