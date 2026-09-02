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

  const itemDate = new Date(props.date)
  const today = new Date()
  const showYear = itemDate.getFullYear() !== today.getFullYear()
  const isToday =
    itemDate.getDate() === today.getDate() &&
    itemDate.getMonth() === today.getMonth() &&
    itemDate.getFullYear() === today.getFullYear()

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