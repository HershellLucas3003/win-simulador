import type { ReactNode } from 'react'
import * as S from './styles'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
}

export interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <S.List role="tablist">
      {items.map((item) => (
        <S.Tab key={item.id} role="tab" aria-selected={item.id === active} $active={item.id === active} onClick={() => onChange(item.id)}>
          {item.icon}
          {item.label}
        </S.Tab>
      ))}
    </S.List>
  )
}
