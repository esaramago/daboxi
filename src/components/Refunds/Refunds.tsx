'use client'

import { useState, useRef, useEffect } from 'react'
import fetchExpenseTransactions from '@/api/fetchExpenseTransactions'
import fetchSuggestedRefundTransactions from '@/api/fetchSuggestedRefundTransactions'
import Loading from '@/components/Loading'
import Date from '@/components/Date'
import Value from '@/components/Value'
import CardButton from '@/components/CardButton'
import type { Transactions } from 'appwrite.d'

import dynamic from 'next/dynamic'
const SlButton = dynamic(() => import('@shoelace-style/shoelace/dist/react/button'), {ssr: false})
const SlDrawer = dynamic(() => import('@shoelace-style/shoelace/dist/react/drawer'), {ssr: false})

interface Props {
  open: boolean
  transactionValue: number
  onClose: Function
  onSelect: Function
}

export default function Refunds(props: Props) {

  const [loading, setLoading] = useState(false)

  //#region Suggested transactions
  const [numberOfSuggestedRefundTransactions, setNumberOfSuggestedRefundTransactions] = useState(0)
  const [suggestedRefundTransactions, setSuggestedRefundTransactions] = useState([])
  //#endregion

  useEffect(() => {
    if (props.open) {
      getSuggestions()
    }
  }, [props.open, props.transactionValue])

  const handleClickRefund = (refund: Transactions) => {
    props.onSelect(refund)
  }

  const getSuggestions = async () => {

    setLoading(true)
    const { data, error: dataError } = await fetchSuggestedRefundTransactions(props.transactionValue)
    if (dataError) {
      console.error(dataError)
      return
    }

    if (data && data.length > 0) {
      setSuggestedRefundTransactions(data)
      setLoading(false)
    } else {
      handleClickShowMoreRefunds()
    }

  }

  const handleClickShowMoreRefunds = async () => {

    const size = numberOfSuggestedRefundTransactions + 10
    setNumberOfSuggestedRefundTransactions(size)

    setLoading(true)
    const { data, error: dataError } = await fetchExpenseTransactions(size)
    setLoading(false)

    if (dataError) {
      console.error(dataError)
      return
    }
    setSuggestedRefundTransactions(data)
    return data
  }



  //#region Drawer
  const drawer = useRef(null)

  const handleOpenDrawer = async () => {
    getSuggestions()
  }

  const handleCloseDrawer = async () => {
    props.onClose()
  }
  //#endregion

  //#region Render
  return (
    <SlDrawer
      label="Reembolso"
      ref={drawer}
      onSlShow={handleOpenDrawer}
      onSlHide={handleCloseDrawer}
      open={props.open}
    >
      <div className="l-stack l-stack--small u-padding-block-end">
        <p>Selecione o reembolso:</p>

        <>
          {
            loading ? <Loading /> :
            <>
              <div>
                {
                  suggestedRefundTransactions.map(transaction => {
                    return (
                      <div key={transaction.$id}>
                        <button
                          id={transaction.$id}
                          value={transaction.value}
                          type="button"
                          onClick={() => handleClickRefund(transaction)}
                          className="u-width-100"
                        >
                          <CardButton
                            variant="expense"
                            icon={transaction.subCategory?.icon}
                            description={transaction.niceDescription || transaction.description}
                            subDescription={transaction.subCategory?.description}
                            right={
                              <>
                                <Value value={transaction.value}></Value>
                                {
                                  <Date date={transaction.date} size="small"></Date>
                                }
                              </>
                            }
                          ></CardButton>
                        </button>
                      </div>
                    )
                  })
                }
              </div>
              <SlButton variant="default" onClick={handleClickShowMoreRefunds}>Mostrar mais</SlButton>
            </>
          }
        </>
      </div>
    </SlDrawer>
  )
  //#endregion
}