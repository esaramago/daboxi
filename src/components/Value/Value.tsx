interface Props {
  value: number
  size?: 'small' | 'large' | 'x-large',
  style?: Object
  sign?: boolean
}

export default function Value(props: Props) {
  const {value, size, sign} = props

  const hasValue = value !== null || !isNaN(value)

  const formatValue = (value) => {
    const decimal = (Math.round(value * 100) / 100).toFixed(2)
    const noSign = decimal.replace('-', '')
    const comma = noSign.replace('.', ',')
    return comma
  }

  const getSign = (value: number, sign: boolean) => {

    if (sign === false || value === 0) {
      return ''
    } else if (value < 0) {
      return '-'
    } else { // value > 0
      return '+'
    }
  }

  return (
    <>
      {
        hasValue ? (
          <span className={`c-value ${size ? `c-value--${size}` : ''}`} style={props.style}>
            {getSign(value, sign)}{formatValue(value)} €
          </span>
        ) : ''
      }
    </>
  )
}