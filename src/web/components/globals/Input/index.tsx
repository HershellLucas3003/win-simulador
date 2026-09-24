import type { InputHTMLAttributes } from 'react'
import * as S from './styles'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  suffix?: string
  error?: string | null
}

export function Input({ label, suffix, error, ...props }: InputProps) {
  return (
    <S.Wrapper>
      {label && <S.Label>{label}</S.Label>}
      <S.Control $hasError={Boolean(error)}>
        <S.Field {...props} aria-invalid={Boolean(error)} />
        {suffix && <S.Suffix>{suffix}</S.Suffix>}
      </S.Control>
      {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
    </S.Wrapper>
  )
}
