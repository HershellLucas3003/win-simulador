import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { TrafficEntry, TrafficKind } from '../../shared/equipment'
import { Signal } from '../events'

export interface TrafficSink {
  log(kind: TrafficKind, message: string, bytes?: Buffer, isPoll?: boolean): void
}

const HISTORY_LIMIT = 3000

const two = (value: number) => String(value).padStart(2, '0')
const three = (value: number) => String(value).padStart(3, '0')

export function formatLogTime(date: Date): string {
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}.${three(date.getMilliseconds())}`
}

export function toHex(bytes: Buffer): string {
  return Array.from(bytes, (byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')
}

export class TrafficLogger implements TrafficSink {
  readonly entry = new Signal<TrafficEntry>()
  private readonly history: TrafficEntry[] = []
  private seq = 0
  private writing: Promise<void> = Promise.resolve()

  constructor(private readonly directory: string | null) {}

  log(kind: TrafficKind, message: string, bytes?: Buffer, isPoll = false): void {
    const now = new Date()
    const hex = bytes && bytes.length > 0 ? toHex(bytes) : null
    const entry: TrafficEntry = { seq: ++this.seq, at: formatLogTime(now), kind, message, hex, isPoll }
    this.history.push(entry)
    if (this.history.length > HISTORY_LIMIT) this.history.splice(0, this.history.length - HISTORY_LIMIT)
    this.entry.emit(entry)
    this.persist(now, entry)
  }

  recent(): TrafficEntry[] {
    return [...this.history]
  }

  private persist(now: Date, entry: TrafficEntry) {
    if (!this.directory) return
    const directory = this.directory
    const file = path.join(directory, `simulator-${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}.log`)
    const line = `[${entry.at}] [${entry.kind.toUpperCase()}] ${entry.message}${entry.hex ? `: ${entry.hex}` : ''}\n`
    this.writing = this.writing
      .then(() => mkdir(directory, { recursive: true }))
      .then(() => appendFile(file, line, 'utf8'))
      .catch(() => undefined)
  }
}
