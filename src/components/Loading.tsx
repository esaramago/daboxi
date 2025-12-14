import './Loading.css'
import dynamic from 'next/dynamic'
const SlSpinner = dynamic(() => import('@shoelace-style/shoelace/dist/react/spinner'), {ssr: false})

interface Props {
  size?: 'small'
}

export default function Loading(props: Props) {
  return (
    <div className={`c-loading ${props.size ? `c-loading--${props.size}` : ''}`}>
      <SlSpinner></SlSpinner>
    </div>
  )
}