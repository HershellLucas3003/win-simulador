import type { SelectHTMLAttributes } from 'react'
import * as S from './styles'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  options: SelectOption[]
  error?: string | null
  placeholder?: string
  onChange: (value: string) => void
}

export function Select({ label, options, error, placeholder, onChange, ...props }: SelectProps) {
  return (
    <S.Wrapper>
      {label && <S.Label>{label}</S.Label>}
      <S.Field {...props} $hasError={Boolean(error)} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </S.Field>
      {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
    </S.Wrapper>
  )
}
