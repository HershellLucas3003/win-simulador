const numberFormat = new Intl.NumberFormat('pt-BR')

export const formatNumber = (value: number) => numberFormat.format(value)

export const formatKg = (value: number) => `${numberFormat.format(value)} kg`

export const formatSpeed = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km/h`

export const formatSeconds = (ms: number) => `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`

export function formatOffset(ms: number): string {
  if (ms === 0) return 'sem desvio'
  const sign = ms > 0 ? '+' : '-'
  const total = Math.abs(ms) / 1000
  const minutes = Math.floor(total / 60)
  const seconds = Math.round(total % 60)
  return `${sign}${minutes > 0 ? `${minutes} min ` : ''}${seconds} s`
}

export const parseInteger = (raw: string) => (raw.trim() === '' ? Number.NaN : Number(raw))
