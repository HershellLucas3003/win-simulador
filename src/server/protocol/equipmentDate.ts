import type { EquipmentTimestamp } from '../../shared/vehicle'
import { TIMESTAMP_SIZE, YEAR_BASE } from './constants'

const MS_SPLIT = 100

export function timestampFromDate(date: Date): EquipmentTimestamp {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds(),
  }
}

export function timestampToDate(timestamp: EquipmentTimestamp): Date {
  return new Date(
    timestamp.year,
    timestamp.month - 1,
    timestamp.day,
    timestamp.hour,
    timestamp.minute,
    timestamp.second,
    timestamp.millisecond,
  )
}

export function encodeTimestamp(timestamp: EquipmentTimestamp): Buffer {
  return Buffer.from([
    timestamp.day,
    timestamp.month,
    timestamp.year - YEAR_BASE,
    timestamp.hour,
    timestamp.minute,
    timestamp.second,
    Math.floor(timestamp.millisecond / MS_SPLIT),
    timestamp.millisecond % MS_SPLIT,
  ])
}

export function decodeTimestamp(bytes: Buffer): EquipmentTimestamp {
  if (bytes.length < TIMESTAMP_SIZE) {
    throw new RangeError(`timestamp needs ${TIMESTAMP_SIZE} bytes, got ${bytes.length}`)
  }
  return {
    day: bytes[0],
    month: bytes[1],
    year: YEAR_BASE + bytes[2],
    hour: bytes[3],
    minute: bytes[4],
    second: bytes[5],
    millisecond: bytes[6] * MS_SPLIT + bytes[7],
  }
}

const pad = (value: number, size: number) => String(value).padStart(size, '0')

export function formatTimestampLikeEquipment(bytes: Buffer): string {
  const [day, month, year, hour, minute, second, msHigh, msLow] = bytes
  return `2${pad(year, 3)}-${pad(month, 2)}-${pad(day, 2)} ${pad(hour, 2)}:${pad(minute, 2)}:${pad(second, 2)}.${msHigh}${pad(msLow, 2)}`
}
