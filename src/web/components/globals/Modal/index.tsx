import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FaTimes } from 'react-icons/fa'
import { Button } from '../Button'
import * as S from './styles'

export interface ModalProps {
  title: string
  children: ReactNode
  onSummit: () => void
  onCancel: () => void
  onSummitName?: string
  onCancelName?: string
  submitting?: boolean
  danger?: boolean
}

export function Modal({ title, children, onSummit, onCancel, onSummitName = 'Confirmar', onCancelName = 'Cancelar', submitting = false, danger = false }: ModalProps) {
  return createPortal(
    <S.Overlay role="dialog" aria-modal="true" aria-label={title}>
      <S.Container>
        <S.Header>
          <S.Title>{title}</S.Title>
          <Button variant="ghost" size="sm" icon={<FaTimes />} onClick={onCancel} disabled={submitting} aria-label="Fechar" />
        </S.Header>
        <S.Content>{children}</S.Content>
        <S.Actions>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            {onCancelName}
          </Button>
          <Button variant={danger ? 'danger' : 'default'} onClick={onSummit} loading={submitting}>
            {onSummitName}
          </Button>
        </S.Actions>
      </S.Container>
    </S.Overlay>,
    document.body,
  )
}
