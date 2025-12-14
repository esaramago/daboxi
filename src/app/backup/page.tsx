'use client'

import Header from '@/components/Header'
import dynamic from 'next/dynamic'
const SlButton = dynamic(() => import('@shoelace-style/shoelace/dist/react/button'), {ssr: false})
import fetchTransactions from '@/api/fetchTransactions'
import fetchSubCategories from '@/api/fetchSubCategories'
import fetchCategories from '@/api/fetchCategories'
import fetchTypes from '@/api/fetchTypes'

export default function Home() {
  
  const exportTransactions = async () => {
    const { data: transactions, error } = await fetchTransactions()
    if (error) {
      console.error(error)
      return
    }

    // export to csv
    const headers = [
      '$id',
      'date',
      'refundsIds',
      'value',
      'netValue',
      'description',
      'niceDescription',
      'subCategory',
    ]
    const csv = transactions.map((transaction) => {
      return `${transaction.$id},${transaction.date},${transaction.refundsIds ?? ''},${transaction.value ?? ''},${transaction.netValue ?? ''},${transaction.description},${transaction.niceDescription},${transaction.subCategory.$id}`
    }).join('\n')

    exportToCSV(headers, csv, 'transactions')
  }

  const exportSubCategories = async () => {
    const { data: subCategories, error: subCategoriesError } = await fetchSubCategories()
    if (subCategoriesError) {
      console.error(subCategoriesError)
      return
    }
    const headers = [
      '$id',
      'code',
      'description',
      'icon',
      'category',
      'budget',
    ]
    const csv = subCategories.map((subCategory) => {
      return `${subCategory.$id},${subCategory.code},${subCategory.description},${subCategory.icon},${subCategory.category.$id},${subCategory.budget ?? ''}`
    }).join('\n')
    exportToCSV(headers, csv, 'subCategories')
  }

  const exportCategories = async () => {
    const { data: categories, error: categoriesError } = await fetchCategories()
    if (categoriesError) {
      console.error(categoriesError)
      return
    }
    const headers = [
      '$id',
      'code',
      'description',
      'icon',
      'type',
    ]
    const csv = categories.map((category) => {
      return `${category.$id},${category.code},${category.description},${category.icon},${category.type.$id}`
    }).join('\n')
    exportToCSV(headers, csv, 'categories')
  }

  const exportTypes = async () => {
    const { data: types, error: typesError } = await fetchTypes()
    if (typesError) {
      console.error(typesError)
      return
    }
    const headers = [
      '$id',
      'code',
      'description',
    ]
    const csv = types.map((type) => {
      return `${type.$id},${type.code},${type.description}`
    }).join('\n')
    exportToCSV(headers, csv, 'types')
  }

  const exportToCSV = (headers: string[], csv: string[], filename: string) => {
    const blob = new Blob([headers.join(',') + '\n' + csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename + '.csv'
    a.click()
  }

  return (

    <>
      <Header>Backup</Header>

      <main className="l-container l-stack u-padding-block">
        <SlButton variant="primary" onClick={exportTransactions}>Exportar transações</SlButton>
        <SlButton variant="primary" onClick={exportSubCategories}>Exportar sub-categorias</SlButton>
        <SlButton variant="primary" onClick={exportCategories}>Exportar categorias</SlButton>
        <SlButton variant="primary" onClick={exportTypes}>Exportar tipos</SlButton>
      </main>
    </>
  )
}
