'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import submitTransactions from '@/api/submitTransactions'
import Header from '@/components/Header'
import TransactionForm from '@/components/TransactionForm'
import CreateMultiple from '@/components/_pages/transactions/create/CreateMultiple'
import type { Transactions } from '@/appwrite.d'

import dynamic from 'next/dynamic'
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaTextarea = dynamic(() => import('@awesome.me/webawesome/dist/react/textarea/index.js'), { ssr: false })
const WaTabGroup = dynamic(() => import('@awesome.me/webawesome/dist/react/tab-group/index.js'), { ssr: false })
const WaTabPanel = dynamic(() => import('@awesome.me/webawesome/dist/react/tab-panel/index.js'), { ssr: false })
const WaTab = dynamic(() => import('@awesome.me/webawesome/dist/react/tab/index.js'), { ssr: false })

export default function CreateTransaction() {
  const router = useRouter()

  const [csvContent, setCsvContent] = useState(
    'date,niceDescription,value,subCategory,description,notes\n2026-01-01,"Descrição",-10.01,,,'
  )

  const handleTextareaChange = (event: any) => {
    const csv = event.target.value
    setCsvContent(csv)
  }

  const handleSubmitImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = Papa.parse(csvContent, { header: true })

    const json: Array<Transactions> = (result.data as any[]).map((transaction: any) => {
      const undefinedSubCategoryId = '693358aa38f7be9fcaa5'
      return {
        date: new Date(transaction.date),
        value: Number(transaction.value),
        description: transaction.description || null,
        niceDescription: transaction.niceDescription,
        notes: transaction.notes || null,
        subCategory: transaction.subCategory || undefinedSubCategoryId,
      } as unknown as Transactions
    })

    try {
      const results = await submitTransactions(json)

      const hasErrors = results.some((res: any) => res.error)
      if (hasErrors) {
        alert(
          `Erro ao importar os movimentos: ${results
            .filter((res: any) => res.error)
            .map((res: any) => res.error.message || res.error)
            .join(', ')}`
        )
        return
      }
      router.push('/')
    } catch (error: any) {
      alert(`Erro ao importar o movimento: ${error.message}`)
    }
  }

  return (
    <>
      <Header>Adicionar movimentos</Header>

      <main className="l-container l-container--wide u-padding-block">
        <WaTabGroup>
          <WaTab slot="nav" panel="add-single">
            Criar
          </WaTab>
          <WaTab slot="nav" panel="add-multiple">
            Criar em lote
          </WaTab>
          <WaTab slot="nav" panel="add-csv">
            Importar via csv
          </WaTab>

          <WaTabPanel name="add-single">
            <TransactionForm redirectTo="/" />
          </WaTabPanel>
          <WaTabPanel name="add-multiple">
            <CreateMultiple />
          </WaTabPanel>
          <WaTabPanel name="add-csv">
            <form className="l-stack l-stack--small" onSubmit={handleSubmitImport}>
              <WaTextarea
                onInput={handleTextareaChange}
                rows={10}
                value={csvContent}
                hint="Fields: date,niceDescription,value,subCategory,description,notes"
              ></WaTextarea>
              <div>
                <WaButton type="submit" variant="brand">
                  Importar movimentos (CSV)
                </WaButton>
              </div>
            </form>
          </WaTabPanel>
        </WaTabGroup>
      </main>
    </>
  )
}