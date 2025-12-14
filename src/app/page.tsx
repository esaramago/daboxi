'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/appwrite'
import { getAuthenticatedUser } from '@/lib/appwriteServer'
import Link from 'next/link'
import Image from 'next/image'
import fetchTransactions from '@/api/fetchTransactions'
import fetchTransactionsByMonth from '@/api/fetchTransactionsByMonth'
import Header from '@/components/Header'
import ButtonTransaction from '@/components/ButtonTransaction'
import Date from '@/components/Date'
import StickyButton from '@/components/StickyButton'
import Resume from '@/components/Resume/Resume'
import Loading from '@/components/Loading'
import dynamic from 'next/dynamic'
const SlButton = dynamic(() => import('@shoelace-style/shoelace/dist/react/button'), {ssr: false})
const SlCard = dynamic(() => import('@shoelace-style/shoelace/dist/react/card'), {ssr: false})
const SlAvatar = dynamic(() => import('@shoelace-style/shoelace/dist/react/avatar'), {ssr: false})
const SlDropdown = dynamic(() => import('@shoelace-style/shoelace/dist/react/dropdown'), {ssr: false})

type User = {
  name?: string
  email?: string
}

export default function Home() {

  const router = useRouter()
  const [ user, setUser ] = useState<User | null>({})
  const [ transactionsByDate, setTransactionsByDate ] = useState(null)
  const [ monthTransactions, setMonthTransactions ] = useState(null)

  const getTransactionsByDate = async () => {
    const { data, error } = await fetchTransactions(15)
    if (error) {
      console.error(error)
      return null
    }
    const groupedByDate = Map.groupBy(data, ({ date }) => date)
    return Array.from(groupedByDate)
  }
  const getTransactionsByMonth = async () => {
    const { data, error } = await fetchTransactionsByMonth()
    if (error) {
      console.error(error)
      return null
    }
    return data
  }

  const handleLogout = async () => {
    const { error } = await logout()
    if (error) {
      alert('Erro ao sair: ' + error.message)
    } else {
      router.push('/login')
    }
  }

  useEffect(() => {

    const getUser = async () => {
      const user = await getAuthenticatedUser()
      setUser(user)
    }
    getUser()

    const getData = async () => {
      const _transactionsByDate = await getTransactionsByDate()
      setTransactionsByDate(_transactionsByDate)

      const _monthTransactions = await getTransactionsByMonth()
      setMonthTransactions(_monthTransactions)
    }

    getData()
  }, [])

  return (

    <>
      <Header
        backgroundColor="transparent"
        actions={
          <div className="l-row l-row--small">
            <SlDropdown>
              <button type="button" slot="trigger">
                <SlAvatar label={user.name || user.email} />
              </button>
              <div className="c-dropdown">
                <span className="u-nowrap">Olá, {user.name || user.email}</span>
                <button type="button" className="c-link" onClick={handleLogout}>Sair</button>
              </div>
            </SlDropdown>
          </div>
        }
      >
        <div className="l-row l-row--small">
          <Image
            src="/icon.svg"
            alt="Logo Daboxi"
            width={22}
            height={22}
          ></Image>
          Visão geral
        </div>
      </Header>

      <main className="l-container l-stack u-padding-block">

        <SlCard>
          <Resume transactions={monthTransactions} showDetailsButton={true} />
        </SlCard>

        <section className="l-stack">
          <div className="l-row">
            <h2 className="l-row__fill">Últimos movimentos</h2>
            <Link href="/transactions" className="c-link">Ver todos</Link>
            <Link href="/transactions/create" className="c-link is-hidden-mobile">Adicionar</Link>
          </div>

          {
            transactionsByDate ? transactionsByDate.map((date) => (
              <div
                key={date[0]}
              >
                {
                  date[0] && <Date date={date[0]} sticky={true}></Date>
                }
                {
                  date[1].map((transaction) => (
                    <ButtonTransaction
                      key={transaction.$id}
                      id={transaction.$id}
                      value={transaction.value}
                      netValue={transaction.netValue}
                      variant={transaction.subCategory?.category?.type?.code}
                      icon={transaction.subCategory?.icon}
                      description={transaction.description}
                      niceDescription={transaction.niceDescription}
                      subCategoryDescription={transaction.subCategory?.description}
                    ></ButtonTransaction>
                  ))
                }
              </div>
            )) : <Loading></Loading>
          }
        </section>

        <div className="u-text-center">
          <Link href="/transactions">
            <SlButton>Ver todos os movimentos</SlButton>
          </Link>
        </div>

        <Link href="/transactions/create">
          <StickyButton label="Adicionar movimentos" icon="plus"></StickyButton>
        </Link>

      </main>
    </>
  )
}