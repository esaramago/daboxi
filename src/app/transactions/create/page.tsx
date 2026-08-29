'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { isDate } from '@/utils/isDate'
import submitTransaction from '@/api/submitTransaction'
import submitTransactions from '@/api/submitTransactions'
import updateTransaction from '@/api/updateTransaction'
import Header from '@/components/Header'
import CardButton from '@/components/CardButton'
import Value from '@/components/Value'
import Categories from '@/components/Categories'
import Refunds from '@/components/Refunds'
import CreateMultiple from '@/components/_pages/transactions/create/CreateMultiple'
import type { Transactions, SubCategories } from 'appwrite.d'

import dynamic from 'next/dynamic'
import calcNetValue from '@/utils/calcNetValue'
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), { ssr: false })
const WaTextarea = dynamic(() => import('@awesome.me/webawesome/dist/react/textarea/index.js'), { ssr: false })
const WaTabGroup = dynamic(() => import('@awesome.me/webawesome/dist/react/tab-group/index.js'), { ssr: false })
const WaTabPanel = dynamic(() => import('@awesome.me/webawesome/dist/react/tab-panel/index.js'), { ssr: false })
const WaTab = dynamic(() => import('@awesome.me/webawesome/dist/react/tab/index.js'), { ssr: false })

export default function CreateTransaction() {

  const router = useRouter()

  const [formFields, setFormFields] = useState({
    date: '',
    niceDescription: '',
    description: '',
    value: '',
    subCategory: '',
    refund: ''
  })
  const { date, niceDescription, description, value, subCategory, refund } = formFields

  //#region Categories
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategories>()

  const openCategoriesDrawer = () => {
    setIsCategoriesOpen(true)
  }
  const closeCategoriesDrawer = () => {
    setIsCategoriesOpen(false)
  }
  const handleChangeSubCategory = (subCategory: SubCategories) => {
    setSelectedRefund(null)
    setSelectedSubCategory(subCategory)
    setFormFields({
      ...formFields,
      subCategory: subCategory.$id,
      refund: ''
    })
    closeCategoriesDrawer()
  }

  //#endregion Categories

  //#region Refunds
  const [isRefundsOpen, setIsRefundsOpen] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Transactions>(null)
  const openRefundsDrawer = () => {
    setIsRefundsOpen(true)
  }
  const closeRefundsDrawer = () => {
    setIsRefundsOpen(false)
  }
  const handleChangeRefund = (refund: Transactions) => {
    setSelectedRefund(refund)
    setFormFields({
      ...formFields,
      refund: refund.$id
    })
    closeRefundsDrawer()
  }
  //#endregion Refunds

  const validateFormFields = () => {

    const { date, niceDescription, value, subCategory, refund } = formFields

    const fieldsWithError = []

    if (!date || !isDate(date)) {
      fieldsWithError.push('Data')
    }
    if (!niceDescription) {
      fieldsWithError.push('Descrição')
    }
    if (!value || isNaN(Number(value)) || Number(value) === 0) {
      fieldsWithError.push('Valor')
    }
    if (!subCategory) {
      fieldsWithError.push('Categoria')
    }
    if (subCategory && subCategory === 'refund' && !refund) {
      fieldsWithError.push('Reembolso')
    }

    const hasError = fieldsWithError.length > 0

    if (hasError) {
      alert(`Preenche corretamente os seguintes campos: ${fieldsWithError.join(', ')}`)
    }

    return !hasError
  }

  const handleInputChange = (event) => {
    let { name, value } = event.target

    setFormFields({ ...formFields, [name]: value })
  }

  const handleSubmitForm = async (event) => {
    event.preventDefault()

    try {
      if (validateFormFields()) {

        // Create transaction
        const _value = Number(Number(value).toFixed(2))
        const _netValue = refund ? calcNetValue(_value, selectedRefund.value) : null

        const data = {
          date: new Date(date),
          niceDescription,
          description,
          value: _value,
          subCategory: subCategory,
          refundsIds: refund ? refund : null,
          netValue: _netValue
        }

        const { data: newTransaction, error: newTransactionError } = await submitTransaction(data)

        if (newTransactionError) {
          alert(`Não foi possível gravar transação: ${newTransactionError.message}`)
          return
        }

        if (refund) {
          // update expense
          await updateTransaction(refund, {
            refundsIds: newTransaction.$id,
            netValue: Number((_value + selectedRefund.value).toFixed(2))
          })
        }

        router.push('/')
      }
    } catch (error: any) {
      alert(`Não foi possível gravar transação`)
      console.error(error.message)
    }
  }

  const [csvContent, setCsvContent] = useState('date,niceDescription,value,subCategory,description\n2026-01-01,"Descrição",-10.01,,')
  const handleTextareaChange = (event) => {
    const csv = event.target.value
    setCsvContent(csv)
  }
  const handleSubmitImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // convert csv to json
    const result = Papa.parse(csvContent, { header: true })

    const json: Array<Transactions> = result.data.map((transaction: Transactions) => {
      const undefinedSubCategoryId = '693358aa38f7be9fcaa5'
      return {
        date: new Date(transaction.date),
        value: Number(transaction.value),
        description: transaction.description,
        niceDescription: transaction.niceDescription,
        subCategory: transaction.subCategory || undefinedSubCategoryId,
      }
    })

    try {
      const results = await submitTransactions(json)

      const hasErrors = results.some((result) => result.error)
      if (hasErrors) {
        alert(`Erro ao importar os movimentos: ${results.map((result) => result.error.message).join(', ')}`)
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
          <WaTab slot="nav" panel="add-single">Criar</WaTab>
          <WaTab slot="nav" panel="add-multiple">Criar em lote</WaTab>
          <WaTab slot="nav" panel="add-csv">Importar via csv</WaTab>

          <WaTabPanel name="add-single">
            <form onSubmit={handleSubmitForm} className="l-stack">
              <WaInput
                name="date"
                label="Data"
                type="date"
                onInput={handleInputChange}
                required
                style={{ maxWidth: '180px' }}
              ></WaInput>
              <WaInput
                name="value"
                label="Valor"
                type="number"
                inputmode="decimal"
                step={.01}
                onInput={handleInputChange}
                required
                style={{ maxWidth: '180px' }}
              ></WaInput>
              <WaInput
                name="niceDescription"
                label="Descrição"
                onInput={handleInputChange}
                required
              ></WaInput>
              <WaInput
                name="description"
                label="Entidade (opcional)"
                onInput={handleInputChange}
              ></WaInput>

              <div>
                <label htmlFor="subCategory" className="c-label">Categoria <span className="u-color-danger">*</span></label>
                <button
                  type="button"
                  className="u-width-100"
                  disabled={!formFields.value}
                  onClick={openCategoriesDrawer}
                >
                  {
                    formFields.subCategory && selectedSubCategory ? (
                      <CardButton
                        variant={selectedSubCategory?.category?.type.code}
                        icon={selectedSubCategory?.icon}
                        description={selectedSubCategory?.description}
                        subDescription={selectedSubCategory?.category?.description}
                      ></CardButton>
                    ) : (
                      <CardButton
                        description="Selecione a categoria"
                      ></CardButton>
                    )
                  }
                </button>
                <input id="subCategory" type="hidden" value={formFields.subCategory} />
              </div>

              {
                selectedSubCategory && selectedSubCategory.code === 'refund' &&
                <div>
                  <label htmlFor="refund" className="c-label">Reembolso <span className="u-color-danger">*</span></label>
                  <button
                    type="button"
                    className="u-width-100"
                    onClick={openRefundsDrawer}
                  >
                    {
                      selectedRefund ? (
                        <CardButton
                          key={selectedRefund.$id}
                          variant={selectedRefund.subCategory?.category?.type?.code}
                          icon={selectedRefund.subCategory?.icon}
                          description={selectedRefund.niceDescription || selectedRefund.description}
                          right={
                            <Value value={selectedRefund.value} />
                          }
                        ></CardButton>
                      ) : (
                        <CardButton
                          description="Selecione o Reembolso"
                        ></CardButton>
                      )
                    }
                  </button>
                  <input id="refund" type="hidden" value={formFields.refund} />
                </div>
              }

              <div>
                <WaButton type="submit" variant="brand">Criar</WaButton>
              </div>
            </form>
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
                hint="Fields: date,niceDescription,value,subCategory,description"
              ></WaTextarea>
              <div>
                <WaButton type="submit" variant="brand">Importar movimentos (CSV)</WaButton>
              </div>
            </form>
          </WaTabPanel>
        </WaTabGroup>
      </main>

      {
        formFields.value &&
        <Categories
          transactionValue={Number(formFields.value)}
          open={isCategoriesOpen}
          onClose={closeCategoriesDrawer}
          onSelect={handleChangeSubCategory}
        />
      }
      {
        selectedSubCategory && selectedSubCategory.code === 'refund' &&
        <Refunds
          transactionValue={Number(formFields.value)}
          open={isRefundsOpen}
          onClose={closeRefundsDrawer}
          onSelect={handleChangeRefund}
        />
      }

    </>
  )
}