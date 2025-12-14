export default function getVariant(category?: string) {

  const categoriesVariants = ['undefined', 'income']

  if(!category) {
    return 'undefined'
  } else if (categoriesVariants.includes(category)) {
    return category
  } else {
    return 'expense'
  }
}