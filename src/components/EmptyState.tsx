'use client'
import './EmptyState.css'
import Grid from '@/components/Grid/Grid'
import Icon from '@/components/webawesome/WaIcon'

interface EmptyStateProps {
  children?: React.ReactNode,
  icon?: string,
  variant?: 'warning',
  size?: 'large',
}


export default function EmptyState(props: EmptyStateProps) {
  return (
    <Grid className="c-empty-state" direction="column" align="center" justify="center" gap="l">
      <Icon name={props.icon || 'inbox'} size="3xl" className="c-empty-state__icon"></Icon>
      {props.children || 'Não existem dados disponíveis.'}
    </Grid>
  )
}
