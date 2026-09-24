import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { VehicleReading } from '../../src/shared/vehicle'

export const REAL_LOG_PATH = fileURLToPath(new URL('./real-site1.log', import.meta.url))
export const REAL_LOG_TEXT = readFileSync(REAL_LOG_PATH, 'utf8')

const LOG_LINES = REAL_LOG_TEXT.split(/\r?\n/)

export function capturedFrameAtLine(lineNumber: number): Buffer {
  const line = LOG_LINES[lineNumber - 1]
  const hex = line.slice(line.lastIndexOf(': ') + 2).replace(/\s+/g, '')
  return Buffer.from(hex, 'hex')
}

const day = { year: 2026, month: 9, day: 9 }

const baseSignals = {
  lane: 1,
  gapCm: 0,
  temperatureC: 42,
  validity: 0,
  direction: 0,
  straddleWindow: 0,
  avgSpeed: 97,
  tyreParameter3L: 0,
}

export interface RealFrameCase {
  label: string
  frameLine: number
  reading: VehicleReading
}

export const REAL_FRAMES: RealFrameCase[] = [
  {
    label: 'I1 2 eixos 0ND668J',
    frameLine: 557,
    reading: {
      ...baseSignals,
      numAxles: 2,
      classIndex: 77,
      serial: 2107061,
      classCode: 'I1',
      speedKmh: 143,
      axleWeights: [500, 260],
      axleSpacings: [252],
      length: 429,
      overhang: 41,
      unknown134: 0x951d,
      gross: 760,
      date: { ...day, hour: 13, minute: 16, second: 10, millisecond: 515 },
      unknown152: 0x1d,
      headwayMs: 86000,
      chassisCode: 127,
      unknown190a: 2,
      unknown190b: 0x4f33,
      loopOnTime: 158,
      frontLf: 5,
      middleLf: 70,
      rearLf: 7,
      frontHf: 65,
      middleHf: 127,
      rearHf: 64,
      dateStart: { ...day, hour: 13, minute: 16, second: 10, millisecond: 344 },
      unknown236: 0x0c20,
    },
  },
  {
    label: 'B2 3 eixos',
    frameLine: 1764,
    reading: {
      ...baseSignals,
      numAxles: 3,
      classIndex: 33,
      serial: 2107062,
      classCode: 'B2',
      speedKmh: 76.8,
      axleWeights: [5500, 9360, 10430],
      axleSpacings: [562, 131],
      length: 954,
      overhang: 27,
      unknown134: 0x95d7,
      gross: 25290,
      date: { ...day, hour: 13, minute: 16, second: 29, millisecond: 109 },
      unknown152: 0x1e,
      headwayMs: 18200,
      chassisCode: 55,
      unknown190a: 6,
      unknown190b: 0x467a,
      loopOnTime: 540,
      frontLf: 3,
      middleLf: 30,
      rearLf: 1,
      frontHf: 53,
      middleHf: 55,
      rearHf: 45,
      dateStart: { ...day, hour: 13, minute: 16, second: 28, millisecond: 556 },
      unknown236: 0x0c95,
    },
  },
  {
    label: 'H2 9 eixos 591ES5',
    frameLine: 2604,
    reading: {
      ...baseSignals,
      numAxles: 9,
      classIndex: 75,
      serial: 2107063,
      classCode: 'H2',
      speedKmh: 74.7,
      axleWeights: [4270, 9190, 9900, 12490, 12730, 8730, 7860, 11920, 12150],
      axleSpacings: [451, 131, 506, 125, 306, 132, 516, 126],
      length: 2541,
      overhang: 9,
      unknown134: 0x965e,
      gross: 89240,
      date: { ...day, hour: 13, minute: 16, second: 42, millisecond: 582 },
      unknown152: 0x1f,
      headwayMs: 12600,
      chassisCode: 64,
      unknown190a: 8,
      unknown190b: 0x2f6d,
      loopOnTime: 1320,
      frontLf: 2,
      middleLf: 11,
      rearLf: 2,
      frontHf: 64,
      middleHf: 48,
      rearHf: 48,
      dateStart: { ...day, hour: 13, minute: 16, second: 41, millisecond: 248 },
      unknown236: 0x1544,
    },
  },
]
