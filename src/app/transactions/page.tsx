'use client'

import { useState, useEffect } from 'react'
import fetchTransactions from '@/api/fetchTransactions'
import Header from '@/components/Header'
import Date from '@/components/Date'
import Loading from '@/components/Loading'
import ButtonTransaction from '@/components/ButtonTransaction'
import StickyButton from '@/components/StickyButton'
import EmptyState from '@/components/EmptyState'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import fetchCategories from '@/api/fetchCategories'
import getColorByVariant from '@/utils/getColorByVariant'
import fetchSubCategoriesByCategory from '@/api/fetchSubCategoriesByCategory'
const WaDropdown = dynamic(() => import('@awesome.me/webawesome/dist/react/dropdown/index.js'), {ssr: false})
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), {ssr: false})
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), {ssr: false})
const WaDropdownItem = dynamic(() => import('@awesome.me/webawesome/dist/react/dropdown-item/index.js'), {ssr: false})
import type { Transactions, Categories, SubCategories } from '@/types/pocketbase'

export default function Transactions() {

  const [transactions, setTransactions] = useState<Transactions[]>([])
  const [transactionsByDate, setTransactionsByDate] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getTransactions = async (categoryCode?: string, subCategoryCode?: string) => {
    setIsLoading(true)
    const { data, error } = await fetchTransactions({
      category: categoryCode,
      subCategory: subCategoryCode,
    })
    if (error || !data) {
      console.error(error)
      setTransactions([])
      setTransactionsByDate([])
      setIsLoading(false)
      return null
    }
    setTransactions(data)
    getTransactionsByDate(data)
    setIsLoading(false)
  }

  const getTransactionsByDate = async (transactions: Transactions[]) => {
    if (!transactions || transactions.length === 0) {
      setTransactionsByDate([])
      return
    }
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

  const handleSelectCategory = (event: any) => {
    const categoryCode = event.currentTarget.dataset.category

    if (categoryCode) {
      const _category = categories.find((cat: Categories) => cat.code === categoryCode) || null
      setCategory(_category)
      setSubCategory(null)

      if (_category) {
        getSubCategories(_category.code)
        getTransactions(_category.code)
      } else {
        setSubCategories([])
        getTransactions()
      }
    } else {
      setCategory(null)
      setSubCategory(null)
      setSubCategories([])
      getTransactions()
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

  const handleSelectSubCategory = (event: any) => {
    const subCategoryCode = event.currentTarget.dataset.subcategory

    if (subCategoryCode) {
      const _subCategory = subCategories.find((subCat) => subCat.code === subCategoryCode) || null
      setSubCategory(_subCategory)
      getTransactions(category?.code, subCategoryCode)
    } else {
      setSubCategory(null)
      getTransactions(category?.code)
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

              <WaDropdown>
                <WaButton slot="trigger">
                  {
                    category ? (
                      <span style={{color: getColorByVariant(category.type.code)}} className="l-row l-row--x-small u-semibold">
                        <WaIcon name={category.icon} slot="start" />
                        <strong style={{color: category.type.color}}>{category.description}</strong>
                      </span>
                    ) : 'Categoria'
                  }
                  <WaIcon name="chevron-down" slot="end" />
                </WaButton>
                <WaDropdownItem
                  key="all-categories"
                  onClick={handleSelectCategory}
                  data-category=""
                >
                  <div className="l-row l-row--x-small">
                    <WaIcon name="list" />
                    Todas as categorias
                  </div>
                </WaDropdownItem>
                {
                  categories.map((category) => (
                    <WaDropdownItem
                      key={category.code}
                      onClick={handleSelectCategory}
                      data-category={category.code}
                    >
                      <div className="l-row l-row--x-small">
                        <WaIcon name={category.icon} style={{color: category.type.color}} />
                        {category.description}
                      </div>
                    </WaDropdownItem>
                  ))
                }
              </WaDropdown>
            )
          }
          {
            category && subCategories && (

              <WaDropdown>
                <WaButton slot="trigger">
                  {
                    subCategory ? (
                      <span style={{color: getColorByVariant(category.type.code)}} className="l-row l-row--x-small u-semibold">
                        <WaIcon name={subCategory.icon} slot="start" />
                        <strong className="u-semibold">{subCategory.description}</strong>
                      </span>
                    ) : 'Sub categoria'
                  }
                  <WaIcon name="chevron-down" slot="end" />
                </WaButton>
                <WaDropdownItem
                  key="all-subcategories"
                  onClick={handleSelectSubCategory}
                  data-subcategory=""
                >
                  <div className="l-row l-row--x-small">
                    <WaIcon name="list" />
                    Todas as subcategorias
                  </div>
                </WaDropdownItem>
                {
                  subCategories.map((subCategory) => (
                    <WaDropdownItem
                      key={subCategory.code}
                      onClick={handleSelectSubCategory}
                      data-subcategory={subCategory.code}
                    >
                      <div className="l-row l-row--x-small">
                        <WaIcon name={subCategory.icon} style={{color: subCategory.color}} />
                        {subCategory.description}
                      </div>
                    </WaDropdownItem>
                  ))
                }
              </WaDropdown>
            )
          }

        </div>
        {
          isLoading ? (
            <Loading></Loading>
          ) : transactionsByDate && transactionsByDate.length > 0 ? (
            transactionsByDate.map((date) => (
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
            ))
          ) : (
            <EmptyState icon="receipt">Nenhum movimento encontrado.</EmptyState>
          )
        }

        <Link href="/transactions/create">
          <StickyButton label="Adicionar movimentos" icon="plus"></StickyButton>
        </Link>

      </main>
    </>
  )
}
