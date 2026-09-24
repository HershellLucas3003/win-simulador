import { SerialPort } from 'serialport'
import type { SerialPortInfo, SerialStatus } from '../../shared/equipment'
import { Signal } from '../events'
import { SERIAL_SETTINGS } from '../protocol/constants'
import type { ByteChannel } from './Transport'

type Callback = (error?: Error | null) => void

export interface SerialPortLike {
  readonly isOpen: boolean
  open(callback: Callback): void
  close(callback: Callback): void
  write(data: Buffer, callback: Callback): boolean
  drain(callback: Callback): void
  on(event: 'data', listener: (data: Buffer) => void): unknown
  on(event: 'close', listener: (error?: Error | null) => void): unknown
  on(event: 'error', listener: (error: Error) => void): unknown
  removeAllListeners(): unknown
}

export type SerialPortFactory = (path: string) => SerialPortLike

export const nodeSerialPortFactory: SerialPortFactory = (path) =>
  new SerialPort({ path, ...SERIAL_SETTINGS, autoOpen: false })

const RECONNECT_INTERVAL_MS = 2000
const CANCELLED = 'abertura cancelada'

const promisify = (action: (callback: Callback) => void) =>
  new Promise<void>((resolve, reject) => action((error) => (error ? reject(error) : resolve())))

export class SerialPortTransport implements ByteChannel {
  readonly data = new Signal<Buffer>()
  readonly statusChanged = new Signal<SerialStatus>()
  private port: SerialPortLike | null = null
  private status: SerialStatus = { open: false, path: null, error: null }
  private wantedPath: string | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private generation = 0

  constructor(private readonly factory: SerialPortFactory = nodeSerialPortFactory) {}

  static async list(): Promise<SerialPortInfo[]> {
    const ports = await SerialPort.list()
    return ports.map((port) => ({
      path: port.path,
      manufacturer: port.manufacturer ?? null,
      friendlyName: (port as { friendlyName?: string }).friendlyName ?? null,
    }))
  }

  currentStatus(): SerialStatus {
    return { ...this.status }
  }

  isOpen(): boolean {
    return Boolean(this.port?.isOpen)
  }

  async open(path: string): Promise<void> {
    const generation = ++this.generation
    this.stopReconnect()
    await this.releasePort()
    if (generation !== this.generation) throw new Error(CANCELLED)
    this.wantedPath = path
    try {
      await this.connect(path, generation)
    } catch (error) {
      if (generation === this.generation) this.scheduleReconnect()
      throw error
    }
  }

  async close(): Promise<void> {
    this.generation += 1
    this.wantedPath = null
    this.stopReconnect()
    await this.releasePort()
    this.setStatus({ open: false, path: null, error: null })
  }

  async write(bytes: Buffer): Promise<void> {
    const port = this.port
    if (!port || !port.isOpen) throw new Error('porta serial fechada')
    await promisify((callback) => {
      port.write(bytes, callback)
    })
    await promisify((callback) => port.drain(callback))
  }

  private async releasePort() {
    const port = this.port
    this.port = null
    if (!port) return
    port.removeAllListeners()
    if (port.isOpen) await promisify((callback) => port.close(callback)).catch(() => undefined)
  }

  private async connect(path: string, generation: number) {
    const port = this.factory(path)
    port.on('data', (chunk) => this.data.emit(Buffer.from(chunk)))
    port.on('error', (error) => this.setStatus({ ...this.status, error: error.message }))
    port.on('close', (error) => this.handleUnexpectedClose(port, error))
    try {
      await promisify((callback) => port.open(callback))
    } catch (error) {
      port.removeAllListeners()
      if (generation === this.generation) this.setStatus({ open: false, path, error: (error as Error).message })
      throw error
    }
    if (generation !== this.generation) {
      port.removeAllListeners()
      await promisify((callback) => port.close(callback)).catch(() => undefined)
      throw new Error(CANCELLED)
    }
    this.port = port
    this.stopReconnect()
    this.setStatus({ open: true, path, error: null })
  }

  private handleUnexpectedClose(port: SerialPortLike, error?: Error | null) {
    if (this.port !== port) return
    this.port = null
    port.removeAllListeners()
    this.setStatus({ open: false, path: this.wantedPath, error: error?.message ?? 'porta fechada pelo sistema' })
    this.scheduleReconnect()
  }

  private scheduleReconnect() {
    if (!this.wantedPath || this.reconnectTimer) return
    this.reconnectTimer = setInterval(() => {
      const path = this.wantedPath
      if (!path || this.port) return this.stopReconnect()
      this.connect(path, this.generation).catch(() => undefined)
    }, RECONNECT_INTERVAL_MS)
  }

  private stopReconnect() {
    if (this.reconnectTimer) clearInterval(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private setStatus(status: SerialStatus) {
    this.status = status
    this.statusChanged.emit({ ...status })
  }
}
