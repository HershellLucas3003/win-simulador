import type { ReactNode } from 'react'
import * as S from './styles'

export interface PanelProps {
  title: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  scroll?: boolean
  padded?: boolean
  className?: string
}

export function Panel({ title, icon, actions, children, scroll = true, padded = true, className }: PanelProps) {
  return (
    <S.Panel className={className}>
      <S.Header>
        <S.Title>
          {icon}
          {title}
        </S.Title>
        {actions && <S.Actions>{actions}</S.Actions>}
      </S.Header>
      <S.Body $scroll={scroll} $padded={padded}>
        {children}
      </S.Body>
    </S.Panel>
  )
}
