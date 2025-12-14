export type Variant = 'expense' | 'income' | 'refund' | 'undefined'

export default function getColorByVariant(variant: Variant) {

  let color: string = ''

  switch (variant) {
    case 'expense':
      color = 'var(--sl-color-primary-500)'
      break
    case 'income':
      color = 'var(--sl-color-success-500)'
      break
    case 'refund':
      color = 'var(--sl-color-warning-600)'
      break
    case !variant || 'undefined':
      color = 'var(--sl-color-neutral-500)'
      break
  }

  return color
}