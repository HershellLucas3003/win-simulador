import type { ReplayFrameView } from '../../shared/replay'
import { HEADER_DATA, HEADER_SIZE, HEADER_START, PAYLOAD_OFFSETS, PAYLOAD_SIZE, TIMESTAMP_SIZE } from '../protocol/constants'
import { formatTimestampLikeEquipment } from '../protocol/equipmentDate'
import { decodePayload } from '../protocol/frameDecoder'

const FRAME_LINE_MARKERS = ['Frame completo recebido', 'parou de enviar em']
const HEX_TAIL = /:\s*((?:[0-9A-Fa-f]{2}\s+)*[0-9A-Fa-f]{2})\s*$/
const LOG_TIMESTAMP = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\]/

export interface ParsedLogFrame {
  view: ReplayFrameView
  payload: Buffer
}

function isDataFrame(bytes: Buffer): boolean {
  return bytes.length > HEADER_SIZE && bytes[0] === HEADER_START && bytes[1] === HEADER_DATA
}

export function parseLogFrames(text: string): ParsedLogFrame[] {
  const frames: ParsedLogFrame[] = []
  let previousHex: string | null = null

  text.split(/\r?\n/).forEach((line, lineIndex) => {
    if (!FRAME_LINE_MARKERS.some((marker) => line.includes(marker))) return
    const match = HEX_TAIL.exec(line)
    if (!match) return
    const bytes = Buffer.from(match[1].replace(/\s+/g, ''), 'hex')
    if (!isDataFrame(bytes)) return
    const hex = bytes.toString('hex')
    if (hex === previousHex) return
    previousHex = hex

    const payload = bytes.subarray(HEADER_SIZE)
    const reading = decodePayload(payload)
    const dateStartBytes = Buffer.alloc(TIMESTAMP_SIZE)
    payload.copy(dateStartBytes, 0, PAYLOAD_OFFSETS.dateStart, PAYLOAD_OFFSETS.dateStart + TIMESTAMP_SIZE)

    frames.push({
      payload: padToPayload(payload),
      view: {
        index: frames.length,
        line: lineIndex + 1,
        loggedAt: LOG_TIMESTAMP.exec(line)?.[1] ?? null,
        receivedBytes: bytes.length,
        serial: reading.serial,
        classIndex: reading.classIndex,
        classCode: reading.classCode,
        numAxles: reading.numAxles,
        gross: reading.gross,
        speedKmh: reading.speedKmh,
        dateStart: formatTimestampLikeEquipment(dateStartBytes),
        hex: bytes.toString('hex').toUpperCase(),
      },
    })
  })

  return frames
}

function padToPayload(payload: Buffer): Buffer {
  const padded = Buffer.alloc(PAYLOAD_SIZE)
  payload.copy(padded, 0, 0, Math.min(payload.length, PAYLOAD_SIZE))
  return padded
}
