'use client'

import { useState, useEffect, Fragment, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Resume from '@/components/Resume/Resume'
import Loading from '@/components/Loading'
import CategoryResume from '@/components/CategoryResume'
import fetchTransactionsByMonth from '@/api/fetchTransactionsByMonth'
import fetchCategories from '@/api/fetchCategories'
import type { Transactions, Categories} from 'appwrite.d'
import dynamic from 'next/dynamic'
import exportStats from '@/utils/exportStats'
const SlInput = dynamic(() => import('@shoelace-style/shoelace/dist/react/input'), {ssr: false})
const SlFormatDate = dynamic(() => import('@shoelace-style/shoelace/dist/react/format-date'), {ssr: false})
const SlCard = dynamic(() => import('@shoelace-style/shoelace/dist/react/card'), {ssr: false})
const SlButton = dynamic(() => import('@shoelace-style/shoelace/dist/react/button'), {ssr: false})

function StatsContent() {

  const [loading, setLoading] = useState(true)

  //#region Month
  const [month, setMonth] = useState('')
  const [date, setDate] = useState<Date>()

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const now = new Date
  const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`

  useEffect(() => {
    const urlMonth = searchParams.get('month') // yyyy-mm

    if (urlMonth) {
      setMonth(urlMonth)

      const dateArray = urlMonth.split('-')
      const year = dateArray.at(0)
      const month = dateArray.at(-1)
      const _date = new Date(Number(year), Number(month) - 1, 2)
      setDate(_date)
    } else {
      const now = new Date
      setMonth(getMonth(now))
      setDate(now)
    }
  }, [searchParams])

  const getMonth = (date: Date) => {
    if (!date) return ''

    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')

    return `${year}-${month}`
  }

  const handleDateChange = async (event) => {
    const dateStr = event.currentTarget.value
    const _date = new Date(dateStr)

    const month = getMonth(_date)
    router.push(`${pathname}?month=${month}`)

  }
  //#endregion Month

  //#region Categories
  const [categories, setCategories] = useState<Categories[]>()
  useEffect(() => {
    const getCategories = async () => {
      const { data, error } = await fetchCategories()
      if (error) {
        console.error(error)
        return null
      }

      const categoriesToFilter = ['undefined', 'refund']
      const categoriesFiltered: Categories[] = data.filter((category: Categories) => !categoriesToFilter.includes(category.code))
      setCategories(categoriesFiltered)
    }

    getCategories()
  }, [])
  //#endregion Categories

  //#region Trasactions
  const [transactions, setTransactions] = useState<Transactions[]>()

  const getTransactionsByCategory = (categoryId: Categories['code']) => {
    const transactionByCategory = transactions.filter((trans: Transactions) => trans.subCategory?.category?.code === categoryId)
    return transactionByCategory
  }

  const getTransactions = async (date: Date) => {
    const { data, error } = await fetchTransactionsByMonth(date)
    if (error) {
      console.error(error)
      return null
    }
    return data
  }

  useEffect(() => {

    const getData = async () => {

      if (!date) return null

      setLoading(true)

      const transactions = await getTransactions(date)
      setTransactions(transactions)

      setLoading(false)
    }

    getData()
  }, [date])
  //#endregion Transactions

  //#region Export
  const handleExport = async () => {
    const exported = await exportStats()

    if (!exported.status) {
      alert(exported.message || 'Não foi possível exportar')
    }
  }
  //#endregion Export

  //#region HTML

  return (
    <>
      <Header route="/">Estatísticas de <SlFormatDate date={date || new Date} month="long"></SlFormatDate></Header>
      <main className="l-container l-stack u-padding-block">

        <SlInput
          name="date"
          label="Mês"
          type={'month' as 'date'}
          max={currentMonth}
          onSlInput={handleDateChange}
          value={month}
        />
        {
          loading ? <Loading /> :
          <>
            <SlCard>
              <Resume date={date} transactions={transactions} />
            </SlCard>

            <section className="l-stack">
              <div className="l-row">
                <h2 className="l-row__fill">Gastos por categoria (<SlFormatDate date={date || new Date} month="long" />)</h2>
                <div>
                  <SlButton variant="primary" onClick={handleExport}>Exportar</SlButton>
                </div>
              </div>
              {
                transactions && categories && categories.map((category: Categories) => (
                  <Fragment key={category.code}>
                    <CategoryResume
                      category={category}
                      transactions={getTransactionsByCategory(category.code)}
                    />
                  </Fragment>
                ))
              }
            </section>
          </>
        }
      </main>
    </>
  )
}

export default function Stats() {
  return (
    <Suspense fallback={<Loading />}>
      <StatsContent />
    </Suspense>
  )
}