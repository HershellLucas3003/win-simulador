import type { ReactNode } from 'react'
import * as S from './styles'

export interface BadgeProps {
  tone?: S.BadgeTone
  icon?: ReactNode
  children: ReactNode
  title?: string
}

export function Badge({ tone = 'neutral', icon, children, title }: BadgeProps) {
  return (
    <S.Badge $tone={tone} title={title}>
      {icon}
      {children}
    </S.Badge>
  )
}

export type { BadgeTone } from './styles'
