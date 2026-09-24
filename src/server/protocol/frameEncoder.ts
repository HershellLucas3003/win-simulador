import type { VehicleReading } from '../../shared/vehicle'
import { MAX_FRAME_AXLE_SPACINGS, MAX_FRAME_AXLE_WEIGHTS } from '../../shared/vehicle'
import {
  CLASS_CODE_SIZE,
  DATA_HEADER,
  GAP_SCALE,
  HEADWAY_SCALE,
  PAYLOAD_OFFSETS as O,
  PAYLOAD_SIZE,
  SPEED_SCALE,
  TEMPERATURE_OFFSET,
} from './constants'
import { encodeTimestamp } from './equipmentDate'

const U8_MAX = 0xff
const U16_MAX = 0xffff
const U32_MAX = 0xffffffff
const INT16_MIN = -0x8000
const INT16_MAX = 0x7fff

class PayloadWriter {
  readonly buffer = Buffer.alloc(PAYLOAD_SIZE)

  u8(offset: number, value: number, field: string) {
    this.buffer.writeUInt8(checkRange(value, 0, U8_MAX, field), offset)
  }

  u16(offset: number, value: number, field: string) {
    this.buffer.writeUInt16LE(checkRange(value, 0, U16_MAX, field), offset)
  }

  i16(offset: number, value: number, field: string) {
    this.buffer.writeInt16LE(checkRange(value, INT16_MIN, INT16_MAX, field), offset)
  }

  u32(offset: number, value: number, field: string) {
    this.buffer.writeUInt32LE(checkRange(value, 0, U32_MAX, field), offset)
  }

  bytes(offset: number, value: Buffer) {
    value.copy(this.buffer, offset)
  }
}

function checkRange(value: number, min: number, max: number, field: string): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${field}=${value} fora do intervalo ${min}..${max}`)
  }
  return value
}

function encodeClassCode(code: string): Buffer {
  const bytes = Buffer.alloc(CLASS_CODE_SIZE)
  Buffer.from(code, 'ascii').copy(bytes, 0, 0, CLASS_CODE_SIZE)
  return bytes
}

export function encodePayload(reading: VehicleReading): Buffer {
  const w = new PayloadWriter()

  w.u16(O.numAxles, reading.numAxles, 'numAxles')
  w.u16(O.classIndex, reading.classIndex, 'classIndex')
  w.u32(O.serial, reading.serial, 'serial')
  w.bytes(O.classCode, encodeClassCode(reading.classCode))
  w.u16(O.lane, reading.lane, 'lane')
  w.u16(O.speed, Math.round(reading.speedKmh * SPEED_SCALE), 'speed')

  reading.axleWeights.slice(0, MAX_FRAME_AXLE_WEIGHTS).forEach((weight, index) => {
    w.u16(O.axleWeights + index * 2, weight, `axleWeight${index + 1}`)
  })
  reading.axleSpacings.slice(0, MAX_FRAME_AXLE_SPACINGS).forEach((spacing, index) => {
    w.u16(O.axleSpacings + index * 2, spacing, `axleSpacing${index + 1}`)
  })

  w.u16(O.length, reading.length, 'length')
  w.u16(O.overhang, reading.overhang, 'overhang')
  w.u16(O.gap, Math.round(reading.gapCm / GAP_SCALE), 'gap')
  w.u16(O.unknown134, reading.unknown134, 'unknown134')
  w.i16(O.temperature, reading.temperatureC + TEMPERATURE_OFFSET, 'temperature')
  w.u8(O.validity, reading.validity, 'validity')
  w.u32(O.gross, reading.gross, 'gross')
  w.bytes(O.date, encodeTimestamp(reading.date))
  w.u16(O.unknown152, reading.unknown152, 'unknown152')
  w.u16(O.headway, Math.round(reading.headwayMs / HEADWAY_SCALE), 'headway')
  w.u16(O.direction, reading.direction, 'direction')
  w.u16(O.chassisCode, reading.chassisCode, 'chassisCode')
  w.u16(O.unknown190a, reading.unknown190a, 'unknown190a')
  w.u16(O.unknown190b, reading.unknown190b, 'unknown190b')
  w.u16(O.loopOnTime, reading.loopOnTime, 'loopOnTime')
  w.u16(O.frontLf, reading.frontLf, 'frontLf')
  w.u16(O.middleLf, reading.middleLf, 'middleLf')
  w.u16(O.rearLf, reading.rearLf, 'rearLf')
  w.u16(O.straddleWindow, reading.straddleWindow, 'straddleWindow')
  w.u16(O.avgSpeed, reading.avgSpeed, 'avgSpeed')
  w.u16(O.frontHf, reading.frontHf, 'frontHf')
  w.u16(O.middleHf, reading.middleHf, 'middleHf')
  w.u16(O.rearHf, reading.rearHf, 'rearHf')
  w.bytes(O.dateStart, encodeTimestamp(reading.dateStart))
  w.u16(O.unknown236, reading.unknown236, 'unknown236')
  w.u16(O.tyreParameter3L, reading.tyreParameter3L, 'tyreParameter3L')

  return w.buffer
}

export function buildDataFrame(payload: Buffer): Buffer {
  return Buffer.concat([DATA_HEADER, payload])
}
