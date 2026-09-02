'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

import submitTransaction from '@/api/submitTransaction'
import updateTransaction from '@/api/updateTransaction'
import calcNetValue from '@/utils/calcNetValue'
import CardButton from '@/components/CardButton'
import Value from '@/components/Value'
import Categories from '@/components/Categories'
import Refunds from '@/components/Refunds'
import Grid from '@/components/Grid/Grid'
import type { Transactions, SubCategories } from '@/types/pocketbase'

const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), { ssr: false })
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), { ssr: false })
const WaCard = dynamic(() => import('@awesome.me/webawesome/dist/react/card/index.js'), { ssr: false })

interface TransactionItem {
  id: string
  date: string
  niceDescription: string
  description: string
  value: string
  subCategory: string
  selectedSubCategory?: SubCategories
  refund: string
  selectedRefund?: Transactions
}

const createEmptyItem = (): TransactionItem => ({
  id: Math.random().toString(36).substring(2, 9),
  date: '',
  niceDescription: '',
  description: '',
  value: '',
  subCategory: '',
  selectedSubCategory: undefined,
  refund: '',
  selectedRefund: undefined
})

export default function CreateMultiple() {
  const router = useRouter()

  const [items, setItems] = useState<TransactionItem[]>([
    createEmptyItem(),
    createEmptyItem()
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  //#region Categories Drawer
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null)

  const openCategoriesDrawer = (index: number) => {
    setActiveCategoryIndex(index)
    setIsCategoriesOpen(true)
  }
  const closeCategoriesDrawer = () => {
    setIsCategoriesOpen(false)
    setActiveCategoryIndex(null)
  }
  const handleChangeSubCategory = (subCategory: SubCategories) => {
    if (activeCategoryIndex !== null) {
      setItems((prevItems) => {
        const updated = [...prevItems]
        updated[activeCategoryIndex] = {
          ...updated[activeCategoryIndex],
          subCategory: subCategory.$id,
          selectedSubCategory: subCategory,
          refund: '',
          selectedRefund: undefined
        }
        return updated
      })
    }
    closeCategoriesDrawer()
  }
  //#endregion

  //#region Refunds Drawer
  const [isRefundsOpen, setIsRefundsOpen] = useState(false)
  const [activeRefundIndex, setActiveRefundIndex] = useState<number | null>(null)

  const openRefundsDrawer = (index: number) => {
    setActiveRefundIndex(index)
    setIsRefundsOpen(true)
  }
  const closeRefundsDrawer = () => {
    setIsRefundsOpen(false)
    setActiveRefundIndex(null)
  }
  const handleChangeRefund = (refund: Transactions) => {
    if (activeRefundIndex !== null) {
      setItems((prevItems) => {
        const updated = [...prevItems]
        updated[activeRefundIndex] = {
          ...updated[activeRefundIndex],
          refund: refund.$id,
          selectedRefund: refund
        }
        return updated
      })
    }
    closeRefundsDrawer()
  }
  //#endregion

  const handleAddItem = () => {
    const lastItem = items[items.length - 1]
    const newItem = createEmptyItem()
    if (lastItem && lastItem.date) {
      newItem.date = lastItem.date
    }
    setItems((prev) => [...prev, newItem])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleInputChange = (index: number, event: any) => {
    const { name, value } = event.target
    setItems((prevItems) => {
      const updated = [...prevItems]
      updated[index] = {
        ...updated[index],
        [name]: value
      }
      return updated
    })
  }

  const validateAllItems = () => {
    const errors: string[] = []

    items.forEach((item, index) => {
      const fieldsWithError: string[] = []

      if (!item.date || isNaN(new Date(item.date).getTime())) {
        fieldsWithError.push('Data')
      }
      if (!item.value || isNaN(Number(item.value)) || Number(item.value) === 0) {
        fieldsWithError.push('Valor')
      }
      if (!item.niceDescription) {
        fieldsWithError.push('Descrição')
      }
      if (!item.subCategory) {
        fieldsWithError.push('Categoria')
      }
      if (item.selectedSubCategory?.code === 'refund' && !item.refund) {
        fieldsWithError.push('Reembolso')
      }

      if (fieldsWithError.length > 0) {
        errors.push(`Movimento ${index + 1}: ${fieldsWithError.join(', ')}`)
      }
    })

    if (errors.length > 0) {
      alert(`Preenche corretamente os seguintes campos:\n${errors.join('\n')}`)
      return false
    }

    return true
  }

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateAllItems()) {
      return
    }

    setIsSubmitting(true)

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const _value = Number(Number(item.value).toFixed(2))
        const _netValue = item.refund && item.selectedRefund ? calcNetValue(_value, item.selectedRefund.value) : null

        const data = {
          date: new Date(`${item.date.split('T')[0]}T00:00:00.000Z`),
          niceDescription: item.niceDescription,
          description: item.description || '',
          value: _value,
          subCategory: item.subCategory,
          refundsIds: item.refund ? item.refund : null,
          netValue: _netValue
        }

        const { data: newTransaction, error: newTransactionError } = await submitTransaction(data)

        if (newTransactionError) {
          alert(`Não foi possível gravar o movimento ${i + 1}: ${newTransactionError.message}`)
          setIsSubmitting(false)
          return
        }

        if (item.refund && item.selectedRefund) {
          await updateTransaction(item.refund, {
            refundsIds: newTransaction.$id,
            netValue: Number((_value + item.selectedRefund.value).toFixed(2))
          })
        }
      }

      router.push('/')
    } catch (error: any) {
      alert(`Não foi possível gravar os movimentos: ${error?.message || error}`)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmitForm} className="l-stack l-stack--small">
        {items.map((item, index) => (
          <WaCard
            key={item.id}
          >
            <div className="l-stack l-stack--small">
              <div className="l-row l-row--space-between">
                <h3>Movimento {index + 1}</h3>
                {items.length > 1 && (
                  <WaButton
                    appearance="plain"
                    onClick={() => handleRemoveItem(index)}
                  >
                    Remover
                  </WaButton>
                )}
              </div>

              <div className="l-row l-row--small">
                <WaInput
                  name="date"
                  label="Data"
                  type="date"
                  value={item.date}
                  onInput={(e: any) => handleInputChange(index, e)}
                  required
                ></WaInput>

                <WaInput
                  name="value"
                  label="Valor"
                  type="number"
                  inputmode="decimal"
                  step={0.01}
                  value={item.value}
                  onInput={(e: any) => handleInputChange(index, e)}
                  required
                  style={{ width: '140px' }}
                ></WaInput>
              </div>
              <Grid>
                <WaInput
                  name="niceDescription"
                  label="Descrição"
                  value={item.niceDescription}
                  onInput={(e: any) => handleInputChange(index, e)}
                  required
                  className="l-row__fill"
                ></WaInput>

                <WaInput
                  name="description"
                  label="Entidade (opcional)"
                  value={item.description}
                  onInput={(e: any) => handleInputChange(index, e)}
                ></WaInput>
              </Grid>


              <div>
                <label htmlFor={`subCategory-${item.id}`} className="c-label">
                  Categoria <span className="u-color-danger">*</span>
                </label>
                <button
                  type="button"
                  className="u-width-100"
                  disabled={!item.value}
                  onClick={() => openCategoriesDrawer(index)}
                >
                  {item.subCategory && item.selectedSubCategory ? (
                    <CardButton
                      variant={item.selectedSubCategory?.category?.type.code}
                      icon={item.selectedSubCategory?.icon}
                      description={item.selectedSubCategory?.description}
                      subDescription={item.selectedSubCategory?.category?.description}
                    ></CardButton>
                  ) : (
                    <CardButton description="Selecione a categoria"></CardButton>
                  )}
                </button>
                <input id={`subCategory-${item.id}`} type="hidden" value={item.subCategory} />
              </div>
              {item.selectedSubCategory && item.selectedSubCategory.code === 'refund' && (
                <div>
                  <label htmlFor={`refund-${item.id}`} className="c-label">
                    Reembolso <span className="u-color-danger">*</span>
                  </label>
                  <button
                    type="button"
                    className="u-width-100"
                    onClick={() => openRefundsDrawer(index)}
                  >
                    {item.selectedRefund ? (
                      <CardButton
                        key={item.selectedRefund.$id}
                        variant={item.selectedRefund.subCategory?.category?.type?.code}
                        icon={item.selectedRefund.subCategory?.icon}
                        description={item.selectedRefund.niceDescription || item.selectedRefund.description}
                        right={<Value value={item.selectedRefund.value} />}
                      ></CardButton>
                    ) : (
                      <CardButton description="Selecione o Reembolso"></CardButton>
                    )}
                  </button>
                  <input id={`refund-${item.id}`} type="hidden" value={item.refund} />
                </div>
              )}
            </div>
          </WaCard>
        ))}

        <div className="l-row" style={{ justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <WaButton type="button" variant="neutral" onClick={handleAddItem}>
            + Adicionar movimento
          </WaButton>
          <WaButton type="submit" variant="brand" loading={isSubmitting}>
            Criar movimentos
          </WaButton>
        </div>
      </form>

      <Categories
        transactionValue={activeCategoryIndex !== null ? Number(items[activeCategoryIndex]?.value || 0) : 0}
        open={isCategoriesOpen}
        onClose={closeCategoriesDrawer}
        onSelect={handleChangeSubCategory}
      />

      <Refunds
        transactionValue={activeRefundIndex !== null ? Number(items[activeRefundIndex]?.value || 0) : 0}
        open={isRefundsOpen}
        onClose={closeRefundsDrawer}
        onSelect={handleChangeRefund}
      />
    </>
  )
}