'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isDate } from '@/utils/isDate'
import submitTransaction from '@/api/submitTransaction'
import updateTransaction from '@/api/updateTransaction'
import CardButton from '@/components/CardButton'
import Value from '@/components/Value'
import Categories from '@/components/Categories'
import Refunds from '@/components/Refunds'
import calcNetValue from '@/utils/calcNetValue'
import type { Transactions, SubCategories } from '@/appwrite.d'

import dynamic from 'next/dynamic'
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), { ssr: false })
const WaTextarea = dynamic(() => import('@awesome.me/webawesome/dist/react/textarea/index.js'), { ssr: false })

export interface TransactionFormValues {
  date?: string
  niceDescription?: string
  description?: string
  notes?: string
  value?: string | number
  subCategory?: string
  refund?: string
  enableBankingId?: string
}

interface TransactionFormProps {
  initialValues?: TransactionFormValues
  redirectTo?: string
}

export default function TransactionForm({ initialValues, redirectTo = '/' }: TransactionFormProps) {
  const router = useRouter()

  const [formFields, setFormFields] = useState({
    date: initialValues?.date || '',
    niceDescription: initialValues?.niceDescription || '',
    description: initialValues?.description || '',
    notes: initialValues?.notes || '',
    value: initialValues?.value !== undefined ? String(initialValues.value) : '',
    subCategory: initialValues?.subCategory || '',
    refund: initialValues?.refund || '',
    enableBankingId: initialValues?.enableBankingId || '',
  })

  useEffect(() => {
    if (initialValues) {
      setFormFields(prev => ({
        ...prev,
        date: initialValues.date ?? prev.date,
        niceDescription: initialValues.niceDescription ?? prev.niceDescription,
        description: initialValues.description ?? prev.description,
        notes: initialValues.notes ?? prev.notes,
        value: initialValues.value !== undefined ? String(initialValues.value) : prev.value,
        subCategory: initialValues.subCategory ?? prev.subCategory,
        refund: initialValues.refund ?? prev.refund,
        enableBankingId: initialValues.enableBankingId ?? prev.enableBankingId,
      }))
    }
  }, [initialValues])

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
    setFormFields(prev => ({
      ...prev,
      subCategory: subCategory.$id,
      refund: ''
    }))
    closeCategoriesDrawer()
  }
  //#endregion Categories

  //#region Refunds
  const [isRefundsOpen, setIsRefundsOpen] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Transactions | null>(null)

  const openRefundsDrawer = () => {
    setIsRefundsOpen(true)
  }
  const closeRefundsDrawer = () => {
    setIsRefundsOpen(false)
  }
  const handleChangeRefund = (refund: Transactions) => {
    setSelectedRefund(refund)
    setFormFields(prev => ({
      ...prev,
      refund: refund.$id
    }))
    closeRefundsDrawer()
  }
  //#endregion Refunds

  const validateFormFields = () => {
    const { date, niceDescription, value, subCategory, refund } = formFields
    const fieldsWithError: string[] = []

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
    if (selectedSubCategory && selectedSubCategory.code === 'refund' && !refund) {
      fieldsWithError.push('Reembolso')
    }

    const hasError = fieldsWithError.length > 0

    if (hasError) {
      alert(`Preenche corretamente os seguintes campos: ${fieldsWithError.join(', ')}`)
    }

    return !hasError
  }

  const handleInputChange = (event: any) => {
    const { name, value } = event.target
    setFormFields(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      if (validateFormFields()) {
        const _value = Number(Number(formFields.value).toFixed(2))
        const _netValue = formFields.refund && selectedRefund ? calcNetValue(_value, selectedRefund.value) : null

        const data: any = {
          date: new Date(formFields.date),
          niceDescription: formFields.niceDescription,
          description: formFields.description || null,
          notes: formFields.notes || null,
          value: _value,
          subCategory: formFields.subCategory,
          refundsIds: formFields.refund ? formFields.refund : null,
          netValue: _netValue,
        }

        if (formFields.enableBankingId) {
          data.enableBankingId = formFields.enableBankingId
        }

        const { data: newTransaction, error: newTransactionError } = await submitTransaction(data)

        if (newTransactionError) {
          alert(`Não foi possível gravar transação: ${newTransactionError.message || newTransactionError}`)
          return
        }

        if (formFields.refund && selectedRefund) {
          // update expense
          await updateTransaction(formFields.refund, {
            refundsIds: newTransaction.$id,
            netValue: Number((_value + selectedRefund.value).toFixed(2))
          })
        }

        router.push(redirectTo)
      }
    } catch (error: any) {
      alert(`Não foi possível gravar transação`)
      console.error(error?.message || error)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmitForm} className="l-stack">
        <WaInput
          name="date"
          label="Data"
          type="date"
          value={formFields.date}
          onInput={handleInputChange}
          required
          style={{ maxWidth: '180px' }}
        ></WaInput>
        <WaInput
          name="value"
          label="Valor"
          type="number"
          inputmode="decimal"
          step={0.01}
          value={formFields.value}
          onInput={handleInputChange}
          required
          style={{ maxWidth: '180px' }}
        ></WaInput>
        <WaInput
          name="niceDescription"
          label="Descrição"
          value={formFields.niceDescription}
          onInput={handleInputChange}
          required
        ></WaInput>
        <WaInput
          name="description"
          label="Entidade (opcional)"
          value={formFields.description}
          onInput={handleInputChange}
        ></WaInput>

        <div>
          <label htmlFor="subCategory" className="c-label">
            Categoria <span className="u-color-danger">*</span>
          </label>
          <button
            type="button"
            className="u-width-100"
            disabled={!formFields.value}
            onClick={openCategoriesDrawer}
          >
            {formFields.subCategory && selectedSubCategory ? (
              <CardButton
                variant={selectedSubCategory?.category?.type?.code}
                icon={selectedSubCategory?.icon}
                description={selectedSubCategory?.description}
                subDescription={selectedSubCategory?.category?.description}
              ></CardButton>
            ) : (
              <CardButton description="Selecione a categoria"></CardButton>
            )}
          </button>
          <input id="subCategory" type="hidden" value={formFields.subCategory} />
        </div>

        <WaTextarea
          name="notes"
          label="Notas"
          value={formFields.notes}
          onInput={handleInputChange}
        ></WaTextarea>

        {selectedSubCategory && selectedSubCategory.code === 'refund' && (
          <div>
            <label htmlFor="refund" className="c-label">
              Reembolso <span className="u-color-danger">*</span>
            </label>
            <button
              type="button"
              className="u-width-100"
              onClick={openRefundsDrawer}
            >
              {selectedRefund ? (
                <CardButton
                  key={selectedRefund.$id}
                  variant={selectedRefund.subCategory?.category?.type?.code}
                  icon={selectedRefund.subCategory?.icon}
                  description={selectedRefund.niceDescription || selectedRefund.description || ''}
                  right={<Value value={selectedRefund.value} />}
                ></CardButton>
              ) : (
                <CardButton description="Selecione o Reembolso"></CardButton>
              )}
            </button>
            <input id="refund" type="hidden" value={formFields.refund} />
          </div>
        )}

        <div>
          <WaButton type="submit" variant="brand">
            Criar
          </WaButton>
        </div>
      </form>

      {formFields.value && (
        <Categories
          transactionValue={Number(formFields.value)}
          open={isCategoriesOpen}
          onClose={closeCategoriesDrawer}
          onSelect={handleChangeSubCategory}
        />
      )}
      {selectedSubCategory && selectedSubCategory.code === 'refund' && (
        <Refunds
          transactionValue={Number(formFields.value)}
          open={isRefundsOpen}
          onClose={closeRefundsDrawer}
          onSelect={handleChangeRefund}
        />
      )}
    </>
  )
}

