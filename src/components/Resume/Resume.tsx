'use client'

import { useState, useEffect } from 'react'
import type { Transactions } from 'appwrite.d'
import Value from '@/components/Value'
import Loading from '@/components/Loading'
import Link from 'next/link'
import dynamic from 'next/dynamic'
const SlFormatDate = dynamic(() => import('@shoelace-style/shoelace/dist/react/format-date'), {ssr: false})

interface Props {
  date?: Date
  transactions: Transactions[]
  className?: string
  showDetailsButton?: boolean
}

export default function Resume(props: Props) {

  const [loading, setLoading] = useState(true)
  const [totalExpense, setTotalExpense] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)

  useEffect(() => {

    const getData = async () => {

      if (!props.transactions) return

      const expenseTransactions = props.transactions.filter(x => x.subCategory?.category.type.code === 'expense')
      const incomeTransactions = props.transactions.filter(x => x.subCategory?.category.type.code === 'income')

      const expense = expenseTransactions.reduce((acc, obj) => { return acc + (obj.netValue !== null ? obj.netValue : obj.value); }, 0)
      const income = incomeTransactions.reduce((acc, obj) => { return acc + (obj.netValue !== null ? obj.netValue : obj.value); }, 0)

      setTotalExpense(expense)
      setTotalIncome(income)

      setLoading(false)
    }

    getData()
  }, [props.transactions])

  return (
    <div className={props.className}>
      {
        loading ? <Loading size="small"></Loading> :
        <div className="l-stack l-stack--small">
          <div className="l-row">
            <h2 className="l-row__fill">Balanço de <SlFormatDate date={props.date || new Date} month="long"></SlFormatDate></h2>
            {
              props.showDetailsButton ? <Link href="/stats" className="c-link">Detalhes</Link> : ''
            }
          </div>
          <div>
            <Value value={totalIncome + totalExpense} size="x-large"></Value>
          </div>
          <ul className="l-row">
            <li>
              Gasto: <Value value={totalExpense} sign={false} style={{color: 'var(--sl-color-primary-500)'}}></Value>
            </li>
            <li>
              Ganho: <Value value={totalIncome} sign={false} style={{color: 'var(--sl-color-success-500)'}}></Value><br />
            </li>
          </ul>
        </div>
      }
    </div>
  )
}