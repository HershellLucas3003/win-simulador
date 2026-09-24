import type { VehicleClassInfo } from '../../shared/classes'

export interface VehicleDraft {
  classIndex: number
  classCode: string
  classLabel: string
  imageFolder: string | null
  vehicleClass: VehicleClassInfo | null
  numAxles: number
  lane: number
  speedKmh: number
  axleWeights: number[]
  axleSpacings: number[]
  length: number
  gross: number
  temperatureC: number
  plate: string
  escapePlate: string | null
  presetId: string | null
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export function withAxles(draft: VehicleDraft, axleWeights: number[], axleSpacings: number[], overhangCm: number): VehicleDraft {
  return {
    ...draft,
    numAxles: axleWeights.length,
    axleWeights,
    axleSpacings,
    gross: sum(axleWeights),
    length: sum(axleSpacings) + overhangCm,
  }
}

export function isOverweight(draft: VehicleDraft): boolean {
  const limits = draft.vehicleClass
  if (!limits) return false
  const grossOver = limits.maxWeight > 0 && draft.gross > limits.maxWeight
  const axleOver = limits.maxAxle > 0 && draft.axleWeights.some((weight) => weight > limits.maxAxle)
  return grossOver || axleOver
}
