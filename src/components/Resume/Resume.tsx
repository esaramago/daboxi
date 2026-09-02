'use client'

import { useState, useEffect } from 'react'
import type { Transactions } from '@/types/pocketbase'
import Value from '@/components/Value'
import Loading from '@/components/Loading'
import Link from 'next/link'
import dynamic from 'next/dynamic'
const WaFormatDate = dynamic(() => import('@awesome.me/webawesome/dist/react/format-date/index.js'), {ssr: false})

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
        <div className="l-stack l-stack">
          <div className="l-row">
            <h2 className="l-row__fill">Balanço de <WaFormatDate date={props.date || new Date} month="long"></WaFormatDate></h2>
            {
              props.showDetailsButton ? <Link href="/stats" className="c-link">Detalhes</Link> : ''
            }
          </div>
          <div className="l-row l-row--large">
            <div>
              Despesas<br />
              <Value value={totalExpense} sign={true} style={{ color: 'var(--wa-color-secondary-50)' }} size="large"></Value><br />
            </div>
            <div>
              Receitas<br />
              <Value value={totalIncome} sign={true} style={{ color: 'var(--wa-color-success-50)' }} size="large"></Value><br />
            </div>
          </div>
          <div>Balanço: <Value value={totalIncome + totalExpense} style={{ color: totalIncome + totalExpense > 0 ? 'var(--wa-color-success-50)' : 'var(--wa-color-secondary-50)' }}></Value></div>
        </div>
      }
    </div>
  )
}