'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logout, getAuthenticatedUser } from '@/lib/pocketbaseServer'
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
import Grid from '@/components/Grid/Grid'
import EmptyState from '@/components/EmptyState'
import dynamic from 'next/dynamic'
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), {ssr: false})
const WaCard = dynamic(() => import('@awesome.me/webawesome/dist/react/card/index.js'), {ssr: false})
const WaAvatar = dynamic(() => import('@awesome.me/webawesome/dist/react/avatar/index.js'), {ssr: false})
const WaDropdown = dynamic(() => import('@awesome.me/webawesome/dist/react/dropdown/index.js'), {ssr: false})
import type { Transactions } from '@/types/pocketbase'

type User = {
  name?: string
  email?: string
}

export default function Home() {

  const router = useRouter()
  const [ isLoading, setIsLoading ] = useState(true)
  const [ user, setUser ] = useState<User | null>({})
  const [ transactionsByDate, setTransactionsByDate ] = useState<any[]>([])
  const [ monthTransactions, setMonthTransactions ] = useState<Transactions[]>([])

  const getTransactionsByDate = async () => {
    const { data, error } = await fetchTransactions(15)
    if (error || !data) {
      console.error(error)
      return []
    }
    const groupedByDate = Map.groupBy(data, ({ date }) => date)
    return Array.from(groupedByDate)
  }
  const getTransactionsByMonth = async () => {
    const now = new globalThis.Date()
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    const { data, error } = await fetchTransactionsByMonth(currentMonth)
    if (error || !data) {
      console.error(error)
      return []
    }
    return data
  }

  const handleLogout = async () => {
    const { error } = await logout()
    if (error) {
      alert('Erro ao sair: ' + ((error as any)?.message || 'Erro desconhecido'))
    } else {
      router.push('/login')
    }
  }

  useEffect(() => {

    const getUser = async () => {
      const { user, error } = await getAuthenticatedUser()
      if (error) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    getUser()

    const getData = async () => {
      const _transactionsByDate = await getTransactionsByDate()
      setTransactionsByDate(_transactionsByDate)

      const _monthTransactions = await getTransactionsByMonth()
      setMonthTransactions(_monthTransactions)

      setIsLoading(false)
    }

    getData()
  }, [])

  return (

    <>
      <Header
        backgroundColor="transparent"
        actions={
          <div className="l-row l-row--small">
            <WaDropdown>
              <button type="button" slot="trigger">
                <WaAvatar label={user.name || user.email} />
              </button>
              <div className="c-dropdown">
                <span className="u-nowrap">Olá, {user.name || user.email}</span>
                <button type="button" className="c-link" onClick={handleLogout}>Sair</button>
              </div>
            </WaDropdown>
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

        <WaCard>
          <Resume transactions={monthTransactions} showDetailsButton={true} />
        </WaCard>

        <Grid gap="xl" direction="column">
          <div className="l-row l-row--small">
            <h2 className="l-row__fill">Últimos movimentos</h2>
            <Link href="/enablebanking/transactions" className="c-link">Importar</Link>
            <Link href="/transactions" className="c-link">Ver todos</Link>
            <Link href="/transactions/create" className="c-link is-hidden-mobile">Adicionar</Link>
          </div>

          {
            isLoading ? <Loading></Loading> : (
              <>
                {
                  transactionsByDate?.length > 0 ? (

                    <Grid gap="xl" direction="column">
                      {
                        transactionsByDate.map((date) => (
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
                        ))
                      }
                      <div className="u-text-center">
                        <Link href="/transactions">
                          <WaButton>Ver todos os movimentos</WaButton>
                        </Link>
                      </div>
                    </Grid>
                  ) : (
                    <EmptyState>
                      Ainda não há movimentos. Cria o primeiro!
                      <WaButton variant="brand" onClick={() => router.push('/transactions/create')}>Adicionar movimento</WaButton>
                    </EmptyState>
                  )
                }
              </>
            )
          }

        </Grid>

        <Link href="/transactions/create">
          <StickyButton label="Adicionar movimentos" icon="plus"></StickyButton>
        </Link>

      </main>
    </>
  )
}