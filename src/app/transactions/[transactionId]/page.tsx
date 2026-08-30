'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import fetchTransaction from '@/api/fetchTransaction'
import fetchTransactionsByIds from '@/api/fetchTransactionsByIds'
import updateTransaction from '@/api/updateTransaction'
import updateTransactions from '@/api/updateTransactions'
import deleteTransaction from '@/api/deleteTransaction'
import Value from '@/components/Value'
import Header from '@/components/Header'
import Date from '@/components/Date'
import CardButton from '@/components/CardButton'
import Loading from '@/components/Loading'
import Categories from '@/components/Categories'
import Refunds from '@/components/Refunds'
import getColorByVariant from '@/utils/getColorByVariant'
import getNetValue from '@/utils/getNetValue'
import calcNetValue from '@/utils/calcNetValue'
import type { SubCategories, Transactions } from 'appwrite.d'

import dynamic from 'next/dynamic'
const WaButton = dynamic(() => import('@awesome.me/webawesome/dist/react/button/index.js'), {ssr: false})
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), {ssr: false})
const WaInput = dynamic(() => import('@awesome.me/webawesome/dist/react/input/index.js'), {ssr: false})

export default function Transaction() {

  const router = useRouter()
  const params = useParams()
  const transactionId: string = params.transactionId.toString()

  const [transaction, setTransaction] = useState(null)
  const [refunds, setRefunds] = useState([])

  const [netValue, setNetValue] = useState(null)

  useEffect(() => {

    // Net value
    const _netValue = getNetValue(transaction?.netValue, transaction?.subCategory?.category.code)
    setNetValue(_netValue)

  }, [transaction?.netValue, transaction?.subCategory])

  useEffect(() => {

    const getData = async () => {
      // Transaction
      const { data, error } = await fetchTransaction(transactionId)
      if (error) {
        console.error(error)
        return null
      }
      setTransaction(data)

      // Refunds
      const _refunds = await getRefunds(data.refundsIds)
      setRefunds(_refunds)
    }

    getData().catch(console.error)

  }, [transactionId])

  const getTransaction = async () => {
    const { data, error } = await fetchTransaction(transactionId)
    if (error) {
      console.error(error)
      return null
    }
    setTransaction(data)
    const _refunds = await getRefunds(data.refundsIds)
    setRefunds(_refunds)
  }

  const handleDeleteTransaction = async () => {
    if (window.confirm('Tem a certeza que deseja apagar o movimento?')) {

      try {
        await deleteTransaction(transactionId)

        if (refunds && refunds.length) {
          // update transaction net value
          const refund = refunds[0]
          await updateTransaction(refund.$id, {
            refundsIds: null,
            netValue: null
          })
        }

        router.push('/')
      } catch (error) {
        alert(`Não foi possível apagar movimento`)
        console.error(error.message)
      }
    }
  }

  //#region Refunds
  const [isRefundsOpen, setIsRefundsOpen] = useState(false)

  const openRefundsDrawer = () => {
    setIsRefundsOpen(true)
  }
  const closeRefundsDrawer = () => {
    setIsRefundsOpen(false)
  }

  const getRefunds = async (refundsIds: string) => {

    if (!refundsIds) return

    const refundsIdsArray = refundsIds.split(',')

    const { data, error } = await fetchTransactionsByIds(refundsIdsArray)
    if (error) {
      console.error(error)
      return null
    }
    return data
  }

  const handleChangeRefund = async (refund: Transactions) => {

    if (!transaction) return

    try {
      // update current refund
      await updateTransaction(transactionId, {
        refundsIds: refund.$id,
        netValue: calcNetValue(transaction.value, refund.value)
      })

      // update expense
      await updateTransaction(refund.$id, {
        refundsIds: transactionId,
        netValue: Number((transaction.value + refund.value).toFixed(2))
      })

      closeRefundsDrawer()

      getTransaction() // re-render transaction

    } catch (error) {
      alert(`Não foi possível o reembolso`)
      console.error(error.message)
    }
  }

  const handleDeleteRefunds = async () => {

    if (window.confirm('Tem a certeza que deseja apagar o reembolso?')) {
      try {

        // update current transaction
        await updateTransaction(transactionId, {
          refundsIds: null,
          netValue: null
        })

        // update other transaction
        const otherTransactionsIds = refunds.map(x => x.$id)
        const otherTransactions = otherTransactionsIds.map(id => {
          return {
            id: id,
            fields: {
              refundsIds: null,
              netValue: null
            }
          }
        })

        await updateTransactions(otherTransactions)

        getTransaction() // re-render transaction

      } catch (error) {
        alert(`Não foi possível gravar categoria`)
        console.error(error.message)
      }
    }
  }

  //#endregion Refunds

  //#region Edit date
  const handleOpenDatePicker = () => {
    const dateInput = document.getElementById('date')
    if (dateInput) {
      (dateInput as HTMLInputElement).showPicker()
    }
  }
  const handleChangeDate = async (event) => {
    const date = event.currentTarget.value
    await updateTransaction(transactionId, { date })
    getTransaction() // re-render transaction
  }
  //#endregion Edit date

  //#region Edit descriptions
  const handleChangeNiceDescription = async (event) => {
    const niceDescription = event.currentTarget.value

    if (!niceDescription) return

    try {
      await updateTransaction(transactionId, {
        niceDescription
      })
    } catch (error) {
      alert(`Não foi possível gravar a descrição`)
      console.error(error.message)
    }
  }
  const handleChangeDescription = async (event) => {
    const description = event.currentTarget.value

    try {
      await updateTransaction(transactionId, {
        description
      })
    } catch (error) {
      alert(`Não foi possível gravar a entidade`)
      console.error(error.message)
    }
  }
  //#endregion Edit descriptions

  //#region Edit value
  const handleChangeValue = async (event) => {
    let value = event.currentTarget.value
    value = value.replace(',', '.')
    const valueNumber = parseFloat(value.replace(',', '.'))

    if (isNaN(valueNumber)) {
      alert(`Valor inválido`)
      return
    } else if (transaction.value < 0 && valueNumber > 0 || transaction.value > 0 && valueNumber < 0) { // if changing signal
      transaction.subCategory = null
      return
    }

    await updateTransaction(transactionId, { value: valueNumber })
    getTransaction() // re-render transaction
  }
  //#endregion Edit value

  //#region Category
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  const openCategoriesDrawer = () => {
    setIsCategoriesOpen(true)
  }
  const closeCategoriesDrawer = () => {
    setIsCategoriesOpen(false)
  }

  const handleChangeSubCategory = async (subCategory: SubCategories) => {

    if (subCategory) {

      try {
        // update transaction category
        await updateTransaction(transactionId, {
          subCategory: subCategory.$id
        })

        setIsCategoriesOpen(false)
      } catch (error) {
        alert(`Não foi possível gravar categoria`)
        console.error(error.message)
      }

      const wasRefund = transaction.subCategory?.code === 'refund'
      if (wasRefund) {
        // reset refunds
        debugger
        const refundsIds = refunds?.map(refund => refund.$id) || []
        const data = [...refundsIds, transactionId].map(refundId => {
          return {
            id: refundId,
            fields: {
              refundsIds: null,
              netValue: null
            }
          }
        })

        try {
          await updateTransactions(data)
        } catch (error) {
          alert(`Não foi possível remover os reembolsos`)
          console.error(error.message)
        }
      }

      getTransaction() // re-render transaction

      if (subCategory.code === 'refund') {
        openRefundsDrawer()
      }

    }
  }
  //#endregion Category


  //#region Render
  const variant = transaction?.subCategory?.category?.type?.code
  const backgroundColor = getColorByVariant(variant) || 'var(--wa-color-neutral-50)'

  return (

    <>
      <Header
        backgroundColor={backgroundColor}
        actions={
          <WaButton appearance="plain" onClick={handleDeleteTransaction}>
            <WaIcon name="trash3" label="Apagar movimento"></WaIcon>
          </WaButton>
        }
      >Movimento</Header>
      <main>
        {
          transaction ?
          <>
            <div className="u-padding-block" style={{backgroundColor: backgroundColor}}>
              <div className="l-container">
                <div className="l-stack l-stack--small">
                  <button type="button" onClick={handleOpenDatePicker} className="u-text-start u-justify-start">
                    <Date date={transaction.date.split('T')[0]}></Date>
                  </button>
                  <div className="is-visually-hidden">
                    <label htmlFor="date">Data</label>
                    <input id="date" type="date" value={transaction.date} onChange={handleChangeDate} />
                  </div>
                  <div>
                    <WaInput
                      size="large"
                      className="c-ghost-input c-ghost-input--large"
                      onChange={handleChangeNiceDescription}
                      value={transaction.niceDescription}
                      placeholder="Descrição"
                    />
                    <WaInput
                      className="c-ghost-input"
                      onChange={handleChangeDescription}
                      value={transaction.description}
                      placeholder="Sem entidade"
                    />
                  </div>
                  <div>
                    <WaInput
                      size="large"
                      className="c-ghost-input c-ghost-input--x-large"
                      onChange={handleChangeValue}
                      value={transaction.value.toFixed(2)}
                      placeholder="Valor"
                      inputmode="decimal"
                      step={.01}
                      type="number"
                    >
                      <span slot="end" className="u-font-size-2x-large u-font-semibold">&nbsp;€</span>
                    </WaInput>
                  </div>
                  {
                    netValue != null ? (
                      <div>
                        Valor líquido: <Value value={netValue} />
                      </div>
                    ) : ''
                  }

                </div>
              </div>
            </div>
            <div className="l-container l-stack u-padding-block--small">
              <button type="button" onClick={openCategoriesDrawer}>
                {
                  transaction && transaction.subCategory ? (
                    <CardButton
                      variant={transaction.subCategory.category?.type.code}
                      icon={transaction.subCategory.icon}
                      description={transaction.subCategory.description}
                      subDescription={transaction.subCategory.category?.description}
                    ></CardButton>
                  ) : (
                    <CardButton
                      description="Selecione a categoria"
                    ></CardButton>
                  )
                }
              </button>
              {
                transaction && transaction.subCategory?.code === 'refund' && (
                  <div>
                    <div className="l-row l-row--x-small u-padding-block-end--x-small">
                      <h3>Reembolso</h3>
                      {
                        transaction.refundsIds &&
                        <WaButton
                          appearance="plain"
                          onClick={handleDeleteRefunds}
                        >
                          <WaIcon name="trash3" label="Apagar reembolsos" />
                        </WaButton>
                      }
                    </div>
                    {
                      transaction.refundsIds ? (
                        <div>
                          {
                            refunds.map(transaction => {
                              return (
                                <CardButton
                                  variant={transaction.subCategory?.category?.type}
                                  icon={transaction.subCategory?.icon}
                                  key={transaction.$id}
                                  description={transaction.niceDescription || transaction.description}
                                  right={
                                    <Value value={transaction.value} />
                                  }
                                ></CardButton>
                              )
                            })
                          }
                        </div>
                      ) : (
                        <button type="button" onClick={openRefundsDrawer}>
                          <CardButton
                            description="Adicionar reembolso"
                            subDescription="Sem reembolso"
                          ></CardButton>
                        </button>
                      )
                    }
                  </div>
                )
              }
            </div>
          </> : <Loading></Loading>
        }
      </main>
      {
        transaction?.value &&
          <Categories
            transactionValue={transaction.value}
            open={isCategoriesOpen}
            onClose={closeCategoriesDrawer}
            onSelect={handleChangeSubCategory}
          />
      }
      {
        transaction && transaction.subCategory?.code === 'refund' &&
          <Refunds
            transactionValue={transaction.value}
            open={isRefundsOpen}
            onClose={closeRefundsDrawer}
            onSelect={handleChangeRefund}
          />
      }
    </>
  )
  //#endregion
}