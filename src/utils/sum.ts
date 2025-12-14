export default function sum(array: Array<Object>, property: string) {
  const total = array.reduce((acc, obj) => { return acc + obj[property]; }, 0)
  return total
}