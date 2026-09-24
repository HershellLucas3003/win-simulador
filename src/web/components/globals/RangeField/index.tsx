import type { RandomRange } from '../../../../shared/events'
import { Checkbox } from '../Checkbox'
import { Input } from '../Input'
import * as S from './styles'

export interface RangeFieldProps {
  label: string
  unit: string
  value: RandomRange
  minError?: string | null
  maxError?: string | null
  onChange: (value: RandomRange) => void
}

const toNumber = (raw: string) => (raw.trim() === '' ? Number.NaN : Number(raw))

export function RangeField({ label, unit, value, minError, maxError, onChange }: RangeFieldProps) {
  return (
    <S.Wrapper>
      <S.Legend>{label}</S.Legend>
      <S.Row>
        <Input
          type="number"
          suffix={unit}
          value={Number.isFinite(value.min) ? value.min : ''}
          error={minError}
          disabled={!value.random}
          onChange={(event) => onChange({ ...value, min: toNumber(event.target.value) })}
          aria-label={`${label} mínimo`}
        />
        <S.Separator>até</S.Separator>
        <Input
          type="number"
          suffix={unit}
          value={Number.isFinite(value.max) ? value.max : ''}
          error={maxError}
          onChange={(event) => onChange({ ...value, max: toNumber(event.target.value) })}
          aria-label={`${label} máximo`}
        />
      </S.Row>
      <Checkbox label="Aleatório no intervalo" checked={value.random} onChange={(random) => onChange({ ...value, random })} />
    </S.Wrapper>
  )
}
