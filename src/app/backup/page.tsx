'use client'

import Header from '@/components/Header'
import dynamic from 'next/dynamic'
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), {ssr: false})
import fetchTransactions from '@/api/fetchTransactions'
import fetchSubCategories from '@/api/fetchSubCategories'
import fetchCategories from '@/api/fetchCategories'
import fetchTypes from '@/api/fetchTypes'

import Papa from 'papaparse'

function sanitizeCSVValue(val: any): any {
  if (val === null || val === undefined) {
    return ''
  }

  if (typeof val === 'number' || typeof val === 'boolean') {
    return val
  }

  if (val instanceof Date) {
    return val.toISOString()
  }

  const str = String(val)

  // Valores numéricos legítimos (incluindo números negativos como "-10.50") não são fórmulas
  if (/^-?\d+(\.\d+)?$/.test(str.trim())) {
    return str
  }

  // Se o texto começar por caracteres executáveis de fórmulas (=, +, -, @, tab, cr), prefixa com '
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`
  }

  return str
}

export default function Home() {
  
  const exportTransactions = async () => {
    const { data: transactions, error } = await fetchTransactions()
    if (error || !transactions) {
      console.error(error)
      return
    }

    const headers = [
      '$id',
      'date',
      'refundsIds',
      'value',
      'netValue',
      'description',
      'niceDescription',
      'notes',
      'subCategory',
    ]

    const data = transactions.map((transaction: any) => [
      sanitizeCSVValue(transaction.$id),
      sanitizeCSVValue(transaction.date),
      sanitizeCSVValue(transaction.refundsIds),
      sanitizeCSVValue(transaction.value),
      sanitizeCSVValue(transaction.netValue),
      sanitizeCSVValue(transaction.description),
      sanitizeCSVValue(transaction.niceDescription),
      sanitizeCSVValue(transaction.notes),
      sanitizeCSVValue(transaction.subCategory?.$id || transaction.subCategory),
    ])

    const csv = Papa.unparse({ fields: headers, data })
    exportToCSV(csv, 'transactions')
  }

  const exportSubCategories = async () => {
    const { data: subCategories, error: subCategoriesError } = await fetchSubCategories()
    if (subCategoriesError || !subCategories) {
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

    const data = subCategories.map((subCategory: any) => [
      sanitizeCSVValue(subCategory.$id),
      sanitizeCSVValue(subCategory.code),
      sanitizeCSVValue(subCategory.description),
      sanitizeCSVValue(subCategory.icon),
      sanitizeCSVValue(subCategory.category?.$id || subCategory.category),
      sanitizeCSVValue(subCategory.budget),
    ])

    const csv = Papa.unparse({ fields: headers, data })
    exportToCSV(csv, 'subCategories')
  }

  const exportCategories = async () => {
    const { data: categories, error: categoriesError } = await fetchCategories()
    if (categoriesError || !categories) {
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

    const data = categories.map((category: any) => [
      sanitizeCSVValue(category.$id),
      sanitizeCSVValue(category.code),
      sanitizeCSVValue(category.description),
      sanitizeCSVValue(category.icon),
      sanitizeCSVValue(category.type?.$id || category.type),
    ])

    const csv = Papa.unparse({ fields: headers, data })
    exportToCSV(csv, 'categories')
  }

  const exportTypes = async () => {
    const { data: types, error: typesError } = await fetchTypes()
    if (typesError || !types) {
      console.error(typesError)
      return
    }

    const headers = [
      '$id',
      'code',
      'description',
    ]

    const data = types.map((type: any) => [
      sanitizeCSVValue(type.$id),
      sanitizeCSVValue(type.code),
      sanitizeCSVValue(type.description),
    ])

    const csv = Papa.unparse({ fields: headers, data })
    exportToCSV(csv, 'types')
  }

  const exportToCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (

    <>
      <Header>Backup</Header>

      <main className="l-container l-stack u-padding-block">
        <WaButton variant="brand" onClick={exportTransactions}>Exportar transações</WaButton>
        <WaButton variant="brand" onClick={exportSubCategories}>Exportar sub-categorias</WaButton>
        <WaButton variant="brand" onClick={exportCategories}>Exportar categorias</WaButton>
        <WaButton variant="brand" onClick={exportTypes}>Exportar tipos</WaButton>
      </main>
    </>
  )
}
