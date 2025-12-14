'use client'

import { useState, useRef } from 'react'
import fetchSubCategoriesByCategory from '@/api/fetchSubCategoriesByCategory'
import fetchCategories from '@/api/fetchCategories'
import CardButton from '@/components/CardButton'
import Loading from '@/components/Loading'
import type { SubCategories } from '@/appwrite.d'
import dynamic from 'next/dynamic'
const SlDrawer = dynamic(() => import('@shoelace-style/shoelace/dist/react/drawer'), {ssr: false})
const SlIconButton = dynamic(() => import('@shoelace-style/shoelace/dist/react/icon-button'), {ssr: false})

interface Props {
  open: boolean
  transactionValue: number
  onClose: Function
  onSelect: Function
}

export default function Categories(props: Props) {

  const drawer = useRef(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])

  const [view, setView] = useState('categories')

  const getSubCategories = async (categoryCode: string) => {
    const { data, error } = await fetchSubCategoriesByCategory(categoryCode)
    if (error) {
      console.error(error)
      return null
    }
    return data
  }
  const handleChangeCategory = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const categoryCode = event.currentTarget.dataset.category

    setView('subCategories')

    setLoading(true)

    const data = await getSubCategories(categoryCode)
    setSubCategories(data)

    // If category has only one subcategory, select it
    if (data.length === 1) {
      handleChangeSubCategory(data[0])
    }

    setLoading(false)
  }
  const handleChangeSubCategory = (subCategory: SubCategories) => {
    if (subCategory) {
      props.onSelect(subCategory)
    }
  }

  //#region Drawer
  const handleOpenDrawer = async () => {

    // Categories
    const isIncome = props.transactionValue > 0
    const transactionType = isIncome ? 'income' : 'expense'
    const { data, error } = await fetchCategories(transactionType)
    if (error) {
      return null
    }
    setCategories(data)
  }
  const handleCloseDrawer = async () => {
    props.onClose()
  }
  //#endregion

  //#region Render
  return (

    <SlDrawer
      label="Categoria"
      ref={drawer}
      onSlShow={handleOpenDrawer}
      onSlHide={handleCloseDrawer}
      open={props.open}
    >
      <div className="l-stack l-stack--small u-padding-block-end">
        {
          view === 'categories' ?
          <>
            <p>Escolhe o tipo de categoria:</p>
            <div>
              {
                categories.map(category => {
                  return (
                    <div key={category.code}>
                      <button
                        data-category={category.code}
                        type="button"
                        onClick={handleChangeCategory}
                      >
                        <CardButton
                          variant={category.type.code}
                          icon={category.icon}
                          description={category.description}
                        ></CardButton>
                      </button>
                    </div>
                  )
                })
              }
            </div>
          </> :
          <>
            <div className="l-row l-row--x-small">
              <SlIconButton name="arrow-left" onClick={() => setView('categories')}></SlIconButton>
              <p>Seleciona a categoria:</p>
            </div>

            {
              loading ? <Loading /> :
              <div>
                {
                  subCategories.map(subCategory => {
                    return (
                      <div key={subCategory.code}>
                        <button
                          type="button"
                          onClick={() => handleChangeSubCategory(subCategory)}
                        >
                          <CardButton
                            variant={subCategory?.category.type.code}
                            icon={subCategory.icon}
                            description={subCategory.description}
                          ></CardButton>
                        </button>
                      </div>
                    )
                  })
                }
              </div>
            }
          </>
        }
      </div>
    </SlDrawer>
  )
  //#endregion
}