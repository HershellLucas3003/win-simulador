import type { VehicleReading } from '../../shared/vehicle'
import { MAX_FRAME_AXLE_SPACINGS, MAX_FRAME_AXLE_WEIGHTS } from '../../shared/vehicle'
import {
  CLASS_CODE_SIZE,
  GAP_SCALE,
  HEADWAY_SCALE,
  PAYLOAD_OFFSETS as O,
  PAYLOAD_SIZE,
  SPEED_SCALE,
  TEMPERATURE_OFFSET,
  TIMESTAMP_SIZE,
} from './constants'
import { decodeTimestamp } from './equipmentDate'

function padPayload(payload: Buffer): Buffer {
  if (payload.length >= PAYLOAD_SIZE) return payload.subarray(0, PAYLOAD_SIZE)
  const padded = Buffer.alloc(PAYLOAD_SIZE)
  payload.copy(padded)
  return padded
}

function decodeClassCode(bytes: Buffer): string {
  const text = bytes.toString('ascii')
  const nul = text.indexOf('\0')
  return (nul >= 0 ? text.slice(0, nul) : text).trim()
}

const u16Array = (buffer: Buffer, offset: number, count: number) =>
  Array.from({ length: count }, (_, index) => buffer.readUInt16LE(offset + index * 2))

export function decodePayload(rawPayload: Buffer): VehicleReading {
  const b = padPayload(rawPayload)
  const u16 = (offset: number) => b.readUInt16LE(offset)

  return {
    numAxles: u16(O.numAxles),
    classIndex: u16(O.classIndex),
    serial: b.readUInt32LE(O.serial),
    classCode: decodeClassCode(b.subarray(O.classCode, O.classCode + CLASS_CODE_SIZE)),
    lane: u16(O.lane),
    speedKmh: u16(O.speed) / SPEED_SCALE,
    axleWeights: u16Array(b, O.axleWeights, MAX_FRAME_AXLE_WEIGHTS),
    axleSpacings: u16Array(b, O.axleSpacings, MAX_FRAME_AXLE_SPACINGS),
    length: u16(O.length),
    overhang: u16(O.overhang),
    gapCm: u16(O.gap) * GAP_SCALE,
    unknown134: u16(O.unknown134),
    temperatureC: b.readInt16LE(O.temperature) - TEMPERATURE_OFFSET,
    validity: b.readUInt8(O.validity),
    gross: b.readUInt32LE(O.gross),
    date: decodeTimestamp(b.subarray(O.date, O.date + TIMESTAMP_SIZE)),
    unknown152: u16(O.unknown152),
    headwayMs: u16(O.headway) * HEADWAY_SCALE,
    direction: u16(O.direction),
    chassisCode: u16(O.chassisCode),
    unknown190a: u16(O.unknown190a),
    unknown190b: u16(O.unknown190b),
    loopOnTime: u16(O.loopOnTime),
    frontLf: u16(O.frontLf),
    middleLf: u16(O.middleLf),
    rearLf: u16(O.rearLf),
    straddleWindow: u16(O.straddleWindow),
    avgSpeed: u16(O.avgSpeed),
    frontHf: u16(O.frontHf),
    middleHf: u16(O.middleHf),
    rearHf: u16(O.rearHf),
    dateStart: decodeTimestamp(b.subarray(O.dateStart, O.dateStart + TIMESTAMP_SIZE)),
    unknown236: u16(O.unknown236),
    tyreParameter3L: u16(O.tyreParameter3L),
  }
}

export function trimAxleArrays(reading: VehicleReading): VehicleReading {
  const weights = Math.min(reading.numAxles, MAX_FRAME_AXLE_WEIGHTS)
  const spacings = Math.min(Math.max(reading.numAxles - 1, 0), MAX_FRAME_AXLE_SPACINGS)
  return {
    ...reading,
    axleWeights: reading.axleWeights.slice(0, weights),
    axleSpacings: reading.axleSpacings.slice(0, spacings),
  }
}
