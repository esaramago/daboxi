export default (transactionValue: number, refundValue: number) => {

  let netValue = 0

  if ((refundValue * -1) <= transactionValue) {
    netValue = Number(transactionValue) - (Number(refundValue.toFixed(2)) * -1)
  }

  return netValue
}