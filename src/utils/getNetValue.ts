export default function getNetValue(netValue?: number, categoryType?: string) {

  if (netValue != null) {
    return netValue
  } else if (categoryType === 'undefined') {
    return 0
  } else {
    return null
  }

}