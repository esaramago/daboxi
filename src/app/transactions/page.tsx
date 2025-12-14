'use client'

import { useState, useEffect } from 'react'
import fetchTransactions from '@/api/fetchTransactions'
import Header from '@/components/Header'
import Date from '@/components/Date'
import Loading from '@/components/Loading'
import ButtonTransaction from '@/components/ButtonTransaction'
import StickyButton from '@/components/StickyButton'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import fetchCategories from '@/api/fetchCategories'
import getColorByVariant from '@/utils/getColorByVariant'
import fetchSubCategoriesByCategory from '@/api/fetchSubCategoriesByCategory'
const SlDropdown = dynamic(() => import('@shoelace-style/shoelace/dist/react/dropdown'), {ssr: false})
const SlButton = dynamic(() => import('@shoelace-style/shoelace/dist/react/button'), {ssr: false})
const SlIcon = dynamic(() => import('@shoelace-style/shoelace/dist/react/icon'), {ssr: false})
const SlMenu = dynamic(() => import('@shoelace-style/shoelace/dist/react/menu'), {ssr: false})
const SlMenuItem = dynamic(() => import('@shoelace-style/shoelace/dist/react/menu-item'), {ssr: false})
import type { Transactions, Categories, SubCategories } from '@/appwrite.d'

export default function Transactions() {

  const [transactions, setTransactions] = useState<Transactions[]>([])
  const [transactionsByDate, setTransactionsByDate] = useState(null)

  const getTransactions = async () => {
    const { data, error } = await fetchTransactions(300)
    if (error) {
      console.error(error)
      return null
    }
    setTransactions(data)
    getTransactionsByDate(data)
  }
  const getTransactionsByDate = async (transactions: Transactions[]) => {
    const groupedByDate = Map.groupBy(transactions, ({ date }) => date)
    setTransactionsByDate(Array.from(groupedByDate))
  }
  useEffect(() => {
    getCategories()
    getTransactions()
  }, [])

  //#region Filter Category
  const [categories, setCategories] = useState<Categories[]>([])
  const [category, setCategory] = useState<Categories | null>(null)

  const getCategories = async () => {
    const { data, error } = await fetchCategories()
    if (error) {
      console.error(error)
      return null
    }
    setCategories(data)
  }
  const filterTransactionsByCategory = (category: string) => {
    const filtered = transactions.filter((transaction) => transaction.subCategory?.category.code === category)
    return filtered
  }

  const handleSelectCategory = (event) => {
    const categoryCode = event.currentTarget.dataset.category

    if (categoryCode) {
      const transactions = filterTransactionsByCategory(categoryCode)
      getTransactionsByDate(transactions)

      const _category = categories.find((cat: Categories) => cat.code === categoryCode)
      setCategory(_category)

      setSubCategory(null)

      getSubCategories(_category.code)
    }
  }
  //#endregion


  //#region Filter SubCategory
  const [subCategories, setSubCategories] = useState<SubCategories[]>([])
  const [subCategory, setSubCategory] = useState<SubCategories | null>(null)
  const getSubCategories = async (categoryCode: string) => {
    const { data, error } = await fetchSubCategoriesByCategory(categoryCode)
    if (error) {
      console.error(error)
      return null
    }
    setSubCategories(data)
  }

  const filterTransactionsBySubCategory = (subCategoryCode: string) => {
    const filtered = transactions.filter((transaction: Transactions) => transaction.subCategory?.code === subCategoryCode)
    return filtered
  }
  const handleSelectSubCategory = (event) => {
    const subCategoryCode = event.currentTarget.dataset.subcategory

    if (subCategoryCode) {
      const transactions = filterTransactionsBySubCategory(subCategoryCode)
      getTransactionsByDate(transactions)

      const subCategory = subCategories.find((subCat) => subCat.code === subCategoryCode)
      setSubCategory(subCategory)
    }
  }

  //#endregion


  //#region Render
  return (
    <>

      <Header>Todos os movimentos</Header>

      <main className="l-container l-stack u-padding-block">

        <div className="l-row l-row--small">
          {
            categories && (

              <SlDropdown>
                <SlButton slot="trigger">
                  {
                    category ? (
                      <span style={{color: getColorByVariant(category.type.code)}} className="l-row l-row--x-small u-semibold">
                        <SlIcon name={category.icon} slot="prefix" />
                        <strong style={{color: category.type.color}}>{category.description}</strong>
                      </span>
                    ) : 'Categoria'
                  }
                  <SlIcon name="chevron-down" slot="suffix" />
                </SlButton>
                <SlMenu>
                  {
                    categories.map((category) => (
                      <SlMenuItem
                        key={category.code}
                        onClick={handleSelectCategory}
                        data-category={category.code}
                      >
                        <div className="l-row l-row--x-small">
                          <SlIcon name={category.icon} style={{color: category.type.color}} />
                          {category.description}
                        </div>
                      </SlMenuItem>
                    ))
                  }
                </SlMenu>
              </SlDropdown>
            )
          }
          {
            category && subCategories && (

              <SlDropdown>
                <SlButton slot="trigger">
                  {
                    subCategory ? (
                      <span style={{color: getColorByVariant(category.type.code)}} className="l-row l-row--x-small u-semibold">
                        <SlIcon name={subCategory.icon} slot="prefix" />
                        <strong className="u-semibold">{subCategory.description}</strong>
                      </span>
                    ) : 'Sub categoria'
                  }
                  <SlIcon name="chevron-down" slot="suffix" />
                </SlButton>
                <SlMenu>
                  {
                    subCategories.map((subCategory) => (
                      <SlMenuItem
                        key={subCategory.code}
                        onClick={handleSelectSubCategory}
                        data-subcategory={subCategory.code}
                      >
                        <div className="l-row l-row--x-small">
                          <SlIcon name={subCategory.icon} style={{color: subCategory.color}} />
                          {subCategory.description}
                        </div>
                      </SlMenuItem>
                    ))
                  }
                </SlMenu>
              </SlDropdown>
            )
          }

        </div>
        {
          transactionsByDate ? transactionsByDate.map((date) => (
            <div
              key={date[0]}
            >
              <Date date={date[0]} sticky={true}></Date>
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

        <Link href="/transactions/create">
          <StickyButton label="Adicionar movimentos" icon="plus"></StickyButton>
        </Link>

      </main>
    </>
  )
}
