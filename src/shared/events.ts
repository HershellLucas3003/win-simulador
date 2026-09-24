export interface RandomRange {
  min: number
  max: number
  random: boolean
}

export interface RandomChance {
  percent: number
  always: boolean
  alwaysValue: boolean
}

export interface EventConfig {
  id: string
  name: string
  classIndex: number | null
  presetId: string | null
  lane: RandomRange
  appearTimeMs: RandomRange
  escapeTimeMs: RandomRange
  speedKmh: RandomRange
  axleWeightKg: RandomRange
  axleDistanceCm: RandomRange
  temperatureC: RandomRange
  differentPlateChance: RandomChance
  escapeChance: RandomChance
  autoEmit: boolean
  autoEmitDelayMs: RandomRange
}

export type VehiclePhase = 'waiting' | 'appeared' | 'escaping' | 'done'

export interface ActiveVehicleView {
  id: string
  eventId: string
  plate: string
  escapePlate: string | null
  classLabel: string
  classIndex: number
  numAxles: number
  gross: number
  speedKmh: number
  axleWeights: number[]
  axleSpacings: number[]
  overweight: boolean
  willEscape: boolean
  appearRemainingMs: number
  escapeRemainingMs: number
  appearProgress: number
  escapeProgress: number
  phase: VehiclePhase
  presetId: string | null
}

export interface PresetDescriptor {
  id: string
  label: string
  description: string
}
