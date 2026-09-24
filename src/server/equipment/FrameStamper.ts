import type { VehicleReading } from '../../shared/vehicle'
import type { RandomSource } from '../generation/random'
import { randomInt } from '../generation/random'
import type { VehicleDraft } from '../generation/VehicleDraft'
import { timestampFromDate } from '../protocol/equipmentDate'
import type { OffsetClock } from './OffsetClock'
import { SerialCounter } from './SerialCounter'

const U16_RANGE = 0x10000
const MAX_HEADWAY_MS = 0xffff * 100
const U16_MAX = 0xffff

export interface StamperState {
  nextSerial: number
  counter134: number
  counter152: number
}

export const INITIAL_STAMPER_STATE: StamperState = { nextSerial: 2107064, counter134: 0x9700, counter152: 0x20 }

const clampU16 = (value: number) => Math.min(Math.max(Math.round(value), 0), U16_MAX)

export class FrameStamper {
  private readonly serial: SerialCounter
  private counter134: number
  private counter152: number
  private lastVehicleAt: number | null = null

  constructor(
    private readonly clock: OffsetClock,
    private readonly random: RandomSource,
    state: StamperState = INITIAL_STAMPER_STATE,
  ) {
    this.serial = new SerialCounter(state.nextSerial)
    this.counter134 = state.counter134
    this.counter152 = state.counter152
  }

  state(): StamperState {
    return { nextSerial: this.serial.peek(), counter134: this.counter134, counter152: this.counter152 }
  }

  setNextSerial(value: number): void {
    this.serial.reset(value)
  }

  stamp(draft: VehicleDraft): VehicleReading {
    const start = this.clock.now()
    const end = new Date(start.getTime() + randomInt(this.random, 150, 1400))
    const headwayMs = this.lastVehicleAt === null ? 0 : Math.min(start.getTime() - this.lastVehicleAt, MAX_HEADWAY_MS)
    this.lastVehicleAt = start.getTime()
    this.counter134 = (this.counter134 + randomInt(this.random, 120, 200)) % U16_RANGE
    this.counter152 = (this.counter152 + 1) % U16_RANGE

    return {
      numAxles: draft.numAxles,
      classIndex: draft.classIndex,
      serial: this.serial.next(),
      classCode: draft.classCode,
      lane: draft.lane,
      speedKmh: draft.speedKmh,
      axleWeights: draft.axleWeights.map(clampU16),
      axleSpacings: draft.axleSpacings.map(clampU16),
      length: clampU16(draft.length),
      overhang: randomInt(this.random, 5, 45),
      gapCm: 0,
      unknown134: this.counter134,
      temperatureC: draft.temperatureC,
      validity: 0,
      gross: draft.gross,
      date: timestampFromDate(end),
      unknown152: this.counter152,
      headwayMs: Math.max(headwayMs, 0),
      direction: 0,
      chassisCode: randomInt(this.random, 30, 130),
      unknown190a: randomInt(this.random, 1, 9),
      unknown190b: randomInt(this.random, 0, U16_MAX),
      loopOnTime: randomInt(this.random, 100, 1500),
      frontLf: randomInt(this.random, 1, 9),
      middleLf: randomInt(this.random, 5, 80),
      rearLf: randomInt(this.random, 1, 9),
      straddleWindow: 0,
      avgSpeed: 97,
      frontHf: randomInt(this.random, 30, 130),
      middleHf: randomInt(this.random, 30, 130),
      rearHf: randomInt(this.random, 30, 130),
      dateStart: timestampFromDate(start),
      unknown236: randomInt(this.random, 0, U16_MAX),
      tyreParameter3L: 0,
    }
  }
}
