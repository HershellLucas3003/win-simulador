import type { ClassCatalogData, ClassIndexInfo } from '../../../shared/classes'
import type { EventConfig, RandomRange } from '../../../shared/events'
import type { SelectOption } from '../../components/globals'

export const REALISTIC_CLASS_VALUE = 'realistic'

const KIND_LABEL: Record<ClassIndexInfo['kind'], string> = {
  mapped: '',
  unclassified: 'sem classe',
  invalid: 'leitura inválida',
  overflow: '11+ eixos',
}

export function classIndexLabel(classes: ClassCatalogData | undefined, classIndex: number | null): string {
  if (classIndex === null) return 'Perfil realista'
  const index = classes?.indexes.find((item) => item.classIndex === classIndex)
  const vehicleClass = classes?.classes.find((item) => item.id === index?.classId)
  if (vehicleClass) return `${classIndex} · ${vehicleClass.name} · ${vehicleClass.axleCount} eixos${index?.code ? ` · ${index.code}` : ''}`
  if (index) return `${classIndex} · ${KIND_LABEL[index.kind]}${index.axleCount ? ` · ${index.axleCount} eixos` : ''}`
  return `${classIndex} · desconhecido`
}

export function classOptions(classes: ClassCatalogData | undefined): SelectOption[] {
  const indexes = classes?.indexes ?? []
  return [
    { value: REALISTIC_CLASS_VALUE, label: 'Perfil realista (distribuição do wim_vbv)' },
    ...indexes.map((index) => ({ value: String(index.classIndex), label: classIndexLabel(classes, index.classIndex) })),
  ]
}

export const toClassValue = (classIndex: number | null) => (classIndex === null ? REALISTIC_CLASS_VALUE : String(classIndex))

export const fromClassValue = (value: string) => (value === REALISTIC_CLASS_VALUE ? null : Number(value))

export type RangeKey = {
  [K in keyof EventConfig]: EventConfig[K] extends RandomRange ? K : never
}[keyof EventConfig]

export interface RangeFieldSpec {
  key: RangeKey
  label: string
  unit: string
  scale: number
}

export const TIMING_FIELDS: RangeFieldSpec[] = [
  { key: 'appearTimeMs', label: 'Tempo até aparecer', unit: 's', scale: 1000 },
  { key: 'escapeTimeMs', label: 'Tempo até a fuga', unit: 's', scale: 1000 },
  { key: 'autoEmitDelayMs', label: 'Intervalo da emissão automática', unit: 's', scale: 1000 },
]

export const VEHICLE_FIELDS: RangeFieldSpec[] = [
  { key: 'speedKmh', label: 'Velocidade', unit: 'km/h', scale: 1 },
  { key: 'axleWeightKg', label: 'Peso por eixo', unit: 'kg', scale: 1 },
  { key: 'axleDistanceCm', label: 'Distância entre eixos', unit: 'cm', scale: 1 },
  { key: 'lane', label: 'Faixa', unit: '', scale: 1 },
  { key: 'temperatureC', label: 'Temperatura', unit: '°C', scale: 1 },
]

export function toDisplayRange(range: RandomRange, scale: number): RandomRange {
  return { ...range, min: range.min / scale, max: range.max / scale }
}

export function fromDisplayRange(range: RandomRange, scale: number): RandomRange {
  const convert = (value: number) => (Number.isFinite(value) ? Math.round(value * scale) : Number.NaN)
  return { ...range, min: convert(range.min), max: convert(range.max) }
}
