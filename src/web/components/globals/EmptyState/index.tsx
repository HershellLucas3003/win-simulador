import type { ReactNode } from 'react'
import * as S from './styles'

export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <S.Wrapper>
      {icon}
      {children}
    </S.Wrapper>
  )
}
