import { EMPTY_RESPONSE, HEADER_SIZE } from '../protocol/constants'
import type { ResponseChunk, ResponsePlan } from './ResponseBehavior'

export const DEFAULT_BODY_DELAY_MS = 4

export const emptyPlan = (): ResponsePlan => ({
  chunks: [{ bytes: Buffer.from(EMPTY_RESPONSE), delayMs: 0 }],
  deliversData: false,
})

export const dataPlan = (chunks: ResponseChunk[]): ResponsePlan => ({ chunks, deliversData: true })

export function splitBySize(bytes: Buffer, chunkSize: number, delayMs: number): ResponseChunk[] {
  const size = Math.max(chunkSize, 1)
  const chunks: ResponseChunk[] = []
  for (let start = 0; start < bytes.length; start += size) {
    chunks.push({ bytes: bytes.subarray(start, start + size), delayMs: start === 0 ? 0 : delayMs })
  }
  return chunks
}

export function realEquipmentChunks(frame: Buffer, frameSize: number, bodyDelayMs = DEFAULT_BODY_DELAY_MS): ResponseChunk[] {
  const sent = frame.subarray(0, Math.min(frameSize, frame.length))
  const header = sent.subarray(0, HEADER_SIZE)
  const body = sent.subarray(HEADER_SIZE)
  return body.length > 0
    ? [{ bytes: header, delayMs: 0 }, { bytes: body, delayMs: bodyDelayMs }]
    : [{ bytes: header, delayMs: 0 }]
}
