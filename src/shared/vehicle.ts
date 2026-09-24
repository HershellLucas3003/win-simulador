export interface EquipmentTimestamp {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}

export interface VehicleReading {
  numAxles: number
  classIndex: number
  serial: number
  classCode: string
  lane: number
  speedKmh: number
  axleWeights: number[]
  axleSpacings: number[]
  length: number
  overhang: number
  gapCm: number
  unknown134: number
  temperatureC: number
  validity: number
  gross: number
  date: EquipmentTimestamp
  unknown152: number
  headwayMs: number
  direction: number
  chassisCode: number
  unknown190a: number
  unknown190b: number
  loopOnTime: number
  frontLf: number
  middleLf: number
  rearLf: number
  straddleWindow: number
  avgSpeed: number
  frontHf: number
  middleHf: number
  rearHf: number
  dateStart: EquipmentTimestamp
  unknown236: number
  tyreParameter3L: number
}

export const MAX_FRAME_AXLE_WEIGHTS = 10
export const MAX_FRAME_AXLE_SPACINGS = 9
