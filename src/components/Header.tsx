'use client'

import './Header.css'
import { useRouter } from 'next/navigation'
import { usePathname  } from 'next/navigation'
import dynamic from 'next/dynamic'
const WaIcon = dynamic(() => import('@awesome.me/webawesome/dist/react/icon/index.js'), {ssr: false})

interface Props {
  children: any
  backgroundColor?: string
  actions?: any
  route?: string
}

export default function Header(props: Props) {

  const { children, backgroundColor, actions } = props

  const router = useRouter()
  const route = usePathname()
  const isRoot = route === '/'

  const goBack = () => {

    if (props.route) {
      router.push(props.route)
    } else {
      router.back()
    }
  }

  return (
    <header className={`c-header ${backgroundColor === 'transparent' && 'c-header--no-background'}`} style={{backgroundColor: backgroundColor}}>
      <div className="l-container">
        <div className="c-header__container">
          {
            isRoot ? (
              <h1>{children}</h1>
            ) : (
              <div className="c-header__title">
                <button onClick={goBack}>
                  <WaIcon name="arrow-left" className="is-hidden-print"></WaIcon>
                  <h1>{children}</h1>
                </button>
              </div>
            )
          }
          <div>
            {actions}
          </div>
        </div>
      </div>
    </header>
  )

}