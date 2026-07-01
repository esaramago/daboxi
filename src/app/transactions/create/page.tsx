'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isDate } from '@/utils/isDate'
import submitTransaction from '@/api/submitTransaction'
import submitTransactions from '@/api/submitTransactions'
import updateTransaction from '@/api/updateTransaction'
import Header from '@/components/Header'
import CardButton from '@/components/CardButton'
import Value from '@/components/Value'
import Categories from '@/components/Categories'
import Refunds from '@/components/Refunds'
import Papa from 'papaparse'
import type { Transactions, SubCategories} from 'appwrite.d'

import dynamic from 'next/dynamic'
import calcNetValue from '@/utils/calcNetValue'
const SlButton = dynamic(() => import('@shoelace-style/shoelace/dist/react/button'), {ssr: false})
const SlInput = dynamic(() => import('@shoelace-style/shoelace/dist/react/input'), {ssr: false})
const SlTextarea = dynamic(() => import('@shoelace-style/shoelace/dist/react/textarea'), {ssr: false})
const SlTabGroup = dynamic(() => import('@shoelace-style/shoelace/dist/react/tab-group'), {ssr: false})
const SlTabPanel = dynamic(() => import('@shoelace-style/shoelace/dist/react/tab-panel'), {ssr: false})
const SlTab = dynamic(() => import('@shoelace-style/shoelace/dist/react/tab'), {ssr: false})

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
  const [selectedRefund, setSelectedRefund] = useState<Transactions>()

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
  //#endregion

  const validateFormFields = () => {

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
    } catch (error) {
      alert(`Não foi possível gravar transação`)
      console.error(error.message)
    }
  }

  const [csvContent, setCsvContent] = useState('date,niceDescription,value,subCategory,description\n2026-01-01,"Descrição",-10,,')
  const handleTextareaChange = (event) => {
    const csv = event.target.value
    setCsvContent(csv)
  }
  const handleSubmitImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // convert csv to json
    const result = Papa.parse(csvContent, {header: true})

    const json:Array<Transactions> = result.data.map((transaction: Transactions) => {
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

    } catch (error) {
      alert(`Erro ao importar o movimento: ${error.message}`)
    }
  }

  return (
    <>
      <Header>Adicionar movimentos</Header>

      <main className="l-container u-padding-block">

        <SlTabGroup>
          <SlTab slot="nav" panel="add-single">Criar</SlTab>
          <SlTab slot="nav" panel="add-multiple">Importar vários</SlTab>

          <SlTabPanel name="add-single">
            <form onSubmit={handleSubmitForm} className="l-stack">
              <SlInput
                name="date"
                label="Data"
                type="date"
                onSlInput={handleInputChange}
                required
                style={{ maxWidth: '180px'}}
              ></SlInput>
              <SlInput
                name="value"
                label="Valor"
                type="number"
                inputmode="decimal"
                step={.01}
                onSlInput={handleInputChange}
                required
                style={{ maxWidth: '180px'}}
              ></SlInput>
              <SlInput
                name="niceDescription"
                label="Descrição"
                onSlInput={handleInputChange}
                required
              ></SlInput>
              <SlInput
                name="description"
                label="Entidade (opcional)"
                onSlInput={handleInputChange}
              ></SlInput>

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
                <SlButton type="submit" variant="primary">Criar</SlButton>
              </div>
            </form>
          </SlTabPanel>
          <SlTabPanel name="add-multiple">
            <form className="l-stack l-stack--small" onSubmit={handleSubmitImport}>
              <SlTextarea
                onSlInput={handleTextareaChange}
                rows={10}
                value={csvContent}
                help-text="Fields: date,niceDescription,value,subCategory,description"
              ></SlTextarea>
              <div>
                <SlButton type="submit" variant="primary">Importar movimentos (CSV)</SlButton>
              </div>
            </form>
          </SlTabPanel>
        </SlTabGroup>
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