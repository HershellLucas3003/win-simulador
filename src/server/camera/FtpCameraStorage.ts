import { Client } from 'basic-ftp'
import type { CameraSettings } from '../../shared/camera'
import type { CameraStorage, UploadFile } from './CameraStorage'

const KEEPALIVE_MS = 15000
const TIMEOUT_MS = 10000

type Connection = Pick<CameraSettings, 'host' | 'port' | 'user' | 'password'>

export class FtpCameraStorage implements CameraStorage {
  private client: Client | null = null
  private homeDir = '/'
  private work: Promise<unknown> = Promise.resolve()
  private keepalive: NodeJS.Timeout | null = null

  constructor(private connection: Connection) {}

  reconfigure(connection: Connection): Promise<void> {
    this.connection = connection
    return this.close()
  }

  isConnected(): boolean {
    return Boolean(this.client && !this.client.closed)
  }

  upload(directory: string, files: UploadFile[]): Promise<void> {
    return this.enqueue(async (client) => {
      await client.cd(this.homeDir)
      await client.ensureDir(directory)
      for (const file of files) await client.uploadFrom(file.localPath, file.remoteName)
      await client.cd(this.homeDir)
    })
  }

  test(): Promise<void> {
    return this.enqueue(async (client) => {
      await client.send('NOOP')
    })
  }

  async close(): Promise<void> {
    this.stopKeepalive()
    const client = this.client
    this.client = null
    client?.close()
  }

  private enqueue(action: (client: Client) => Promise<void>): Promise<void> {
    const run = this.work.then(async () => {
      try {
        await action(await this.connect())
      } catch (error) {
        await this.close()
        throw error
      }
    })
    this.work = run.catch(() => undefined)
    return run
  }

  private async connect(): Promise<Client> {
    if (this.client && !this.client.closed) return this.client
    const client = new Client(TIMEOUT_MS)
    await client.access({
      host: this.connection.host,
      port: this.connection.port,
      user: this.connection.user,
      password: this.connection.password,
      secure: false,
    })
    this.homeDir = await client.pwd()
    this.client = client
    this.startKeepalive()
    return client
  }

  private startKeepalive() {
    this.stopKeepalive()
    this.keepalive = setInterval(() => {
      this.enqueue((client) => client.send('NOOP').then(() => undefined)).catch(() => undefined)
    }, KEEPALIVE_MS)
  }

  private stopKeepalive() {
    if (this.keepalive) clearInterval(this.keepalive)
    this.keepalive = null
  }
}
