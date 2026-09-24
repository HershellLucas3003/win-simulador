import * as S from './styles'

export interface CheckboxProps {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export function Checkbox({ label, checked, disabled = false, onChange }: CheckboxProps) {
  return (
    <S.Wrapper $disabled={disabled}>
      <S.Box type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </S.Wrapper>
  )
}
