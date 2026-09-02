import fetchAllTransactions from '@/api/fetchTransactions'
import getAllSubCategories from '@/api/fetchSubCategories'
import { utils, writeFileXLSX } from 'xlsx'
import type { SubCategories, Transactions } from '@/types/pocketbase'

const createDataStructure = (transactions: Transactions[], subCategories: SubCategories[]) => {

  const data = []

  const transactionsByMonth = Object.groupBy(transactions, transaction => {
    const date = new Date(transaction.date)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    return `${year}-${month}`
  })

  for (let month in transactionsByMonth) {

    const transactions = transactionsByMonth[month]
    const transactionsBySubcategory = Object.groupBy(transactions, (transaction: Transactions) => transaction.subCategory?.code)

    const row = [
      month,
      transactions.reduce((a, b) => a + (b.netValue !== null ? b.netValue : b.value), 0) * -1
    ]

    subCategories.forEach(subCategory => {
      const transactions = transactionsBySubcategory[subCategory.code]

      let totalByCategory = 0
      if (transactions) {
        totalByCategory = transactions.reduce((a, b) => a + (b.netValue !== null ? b.netValue : b.value), 0) * -1
      }

      row.push(totalByCategory.toString().replace('.', ','))
    })

    data.push(row)
  }

  return data
}

const createHeaderStructure = (subCategories: SubCategories[]) => {
  const data = ['Data', 'Total', ]
  subCategories.forEach(subCategory => {
    data.push(subCategory.description)
  })
  return data
}


const transactionsHeaders = [
  {description: 'Data', id: 'date'},
  {description: 'Reembolso', id: 'refundsIds'},
  {description: 'Valor', id: 'value', type: 'number'},
  {description: 'Valor líquido', id: 'netValue', type: 'number'},
  {description: 'Descrição', id: 'niceDescription', type: 'text'},
  {description: 'Entidade', id: 'description', type: 'text'},
  {description: 'Sub-categoria', id: 'subCategory.description'},
  {description: 'Categoria', id: 'subCategory.category.description'},
]

const createTransactionsData = (transactions: Transactions[]) => {
  const data = []
  transactions.forEach(transaction => {
    const row = []
    transactionsHeaders.forEach(header => {
      const type = header.type
      const property = header.id.split('.')
      let cell: any = transaction
      for (let i = 0; i < property.length; i++) {
        if (cell) cell = cell[property[i]]
      }

      if (cell) {
        if (type === 'number') {
          cell = cell.toString()
          cell = cell.replace('.', ',')
        } else if (type === 'text') {
          cell = cell.trim()
        }
      }

      row.push(cell)
    })
    data.push(row)
  })

  return data
}

export default async () => {

  const { data: subCategories, error: subCategoriesError } = await getAllSubCategories()
  if (subCategoriesError) {
    return {
      status: false,
      message: subCategoriesError.message
    }
  }
  const incomeSubCategories: SubCategories[] = subCategories.filter((x: SubCategories) => x.code !== 'undefined' && x.code !== 'refund' && x.category.code !== 'income')

  const { data: transactions, error: transactionsError } = await fetchAllTransactions()
  if (transactionsError) {
    return {
      status: false,
      message: transactionsError.message
    }
  }

  if (!transactions || !incomeSubCategories) return {
    status: false,
    message: 'Nenhum movimento para exportar'
  }

  const statsData = [
    createHeaderStructure(incomeSubCategories),
    ...createDataStructure(transactions, incomeSubCategories)
  ]

  const transactionsData = [
    ['Data', 'Reembolso', 'Valor', 'Valor líquido', 'Descrição', 'Entidade', 'Sub-categoria', 'Categoria'],
    ...createTransactionsData(transactions)
  ]

  const workbook = utils.book_new()

  const worksheetTransactions = utils.json_to_sheet(transactionsData)
  utils.book_append_sheet(workbook, worksheetTransactions, 'Movimentos')

  const worksheetStats = utils.json_to_sheet(statsData)
  utils.book_append_sheet(workbook, worksheetStats, 'Despesas por categoria')

  writeFileXLSX(workbook, 'Finanças pessoais.xlsx')

  return {
    status: true
  }
}