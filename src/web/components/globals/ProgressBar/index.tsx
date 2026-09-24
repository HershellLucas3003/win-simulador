import * as S from './styles'

export interface ProgressBarProps {
  value: number
  tone?: S.ProgressTone
  label?: string
}

export function ProgressBar({ value, tone = 'info', label }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 1)
  return (
    <S.Track role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped * 100)}>
      <S.Fill $value={clamped} $tone={tone} />
    </S.Track>
  )
}
