'use client'

import { useState, useEffect } from 'react'
import fetchSubCategoriesByCategory from '@/api/fetchSubCategoriesByCategory'
import getColorByVariant from '@/utils/getColorByVariant'
import sum from '@/utils/sum'
import Icon from '@/components/Icon'
import Value from '@/components/Value'
import Loading from '@/components/Loading'
import type { Categories, SubCategories, Transactions } from '@/types/pocketbase'
import dynamic from 'next/dynamic'
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), {ssr: false})
const WaCard = dynamic(() => import('@awesome.me/webawesome/dist/react/card/index.js'), {ssr: false})
const WaProgressBar = dynamic(() => import('@awesome.me/webawesome/dist/react/progress-bar/index.js'), {ssr: false})

interface Props {
  category: Categories
  transactions: Transactions[]
}

export default function CategoryResume(props: Props) {

  const color = getColorByVariant(props.category.type.code)
  const [loading, setLoading] = useState(true)

  //#region categories
  const [subCategories, setSubCategories] = useState<SubCategories[]>()

  useEffect(() => {

    const getData = async () => {
      const { data, error } = await fetchSubCategoriesByCategory(props.category.code)
      if (error) {
        console.error(error)
        return null
      }
      setSubCategories(data)

      setLoading(false)
    }
    getData()

  }, [props.category.code])
  //#endregion Categories

  //#region Transactions
  const getTotalBySubcategory = (subCategoryId: string) => {
    const transactionBySubCategory = props.transactions.filter((trans: Transactions) => trans.subCategory?.code === subCategoryId)
    const total = transactionBySubCategory.reduce((acc, obj) => { return acc + (obj.netValue !== null ? obj.netValue : obj.value) }, 0)
    return total
  }

  //#endregion Transactions

  //#region Value
  const [total, setTotal] = useState<number>()
  const [budgetPercentage, setBudgetPercentage] = useState<number>()

  useEffect(() => {
    const total = props.transactions.reduce((acc: number, obj: Transactions) => {
      return acc + (obj.netValue !== null ? obj.netValue : obj.value)
    }, 0)
    setTotal(total as number)

    if (subCategories) {
      const totalBudget = sum(subCategories, 'budget')
      const budgetPercentage = (100 * Math.abs(total)) / totalBudget
      setBudgetPercentage(budgetPercentage)
    }
  }, [subCategories, props.transactions])
  //#endregion


  return (
    <>
      <WaCard className="c-category-resume">
        <div className="l-stack l-stack--small">
          <div className="l-row l-row--small l-row--end">
            <div className="l-row l-row--x-small l-row__fill">
              <Icon
                name={props.category.icon}
                variant={props.category.type.code}
                size="small"
              />
              <h3>{props.category.description}</h3>
            </div>

            <div className="l-stack l-stack--2x-small">
              <Value
                value={total}
                size="large"
                sign={false}
              />
            </div>
          </div>

          {
            props.category.code !== 'income' &&
            <WaProgressBar
              value={budgetPercentage}
              style={{
                '--track-color': 'var(--wa-color-brand-20)',
                '--indicator-color': 'var(--wa-color-brand-50)',
                '--height': '12px',
              } as React.CSSProperties}
            />
          }
        </div>

          {
        loading ? <Loading size="small" /> :
          <div className="l-stack l-stack--x-small">
            {
              subCategories && subCategories.map((subCategory: SubCategories) => {
                const total = getTotalBySubcategory(subCategory.code)
                return (
                  <div key={subCategory.code} className="l-row l-row--x-small">
                    <WaIcon name={subCategory.icon} style={{color: color}} />
                    <span className="l-row__fill">{subCategory.description}</span>
                    {
                      props.category.code === 'income' ? (
                        <Value
                          value={total}
                          sign={false}
                        />
                      ) : (
                        <>
                          <Value
                            value={total}
                            sign={false}
                            style={{
                              color: Math.abs(total) > subCategory.budget ? 'var(--wa-color-danger-50)': ''
                            }}
                          />
                          /
                          <Value
                            value={subCategory.budget}
                            sign={false}
                          />
                        </>
                      )
                    }
                  </div>
                )
              })
            }
          </div>
        }
      </WaCard>
    </>
  )
}