export type Variant = 'expense' | 'income' | 'refund' | 'undefined'

export default function getColorByVariant(variant?: Variant | string | null) {

  let color: string = ''

  switch (variant) {
    case 'expense':
      color = 'var(--wa-color-brand-50)'
      break
    case 'income':
      color = 'var(--wa-color-success-50)'
      break
    case 'refund':
      color = 'var(--wa-color-warning-50)'
      break
    case !variant || 'undefined':
      color = 'var(--wa-color-neutral-50)'
      break
  }

  return color
}