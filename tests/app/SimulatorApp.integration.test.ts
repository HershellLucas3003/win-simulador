import { copyFileSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import bunyan from 'bunyan'
import { FtpSrv } from 'ftp-srv'
import { SerialPortMock } from 'serialport'
import { SimulatorApp } from '../../src/server/app/SimulatorApp'
import { timerDeferrer } from '../../src/server/camera/CameraTiming'
import { JsonFileStore } from '../../src/server/config/JsonFileStore'
import { SimulatorRepository } from '../../src/server/config/SimulatorRepository'
import { realSleep, systemClock } from '../../src/server/events'
import { seededRandom } from '../../src/server/generation/random'
import { TrafficLogger } from '../../src/server/logging/TrafficLogger'
import { decodePayload } from '../../src/server/protocol/frameDecoder'
import type { SerialPortLike } from '../../src/server/transport/SerialPortTransport'
import { SerialPortTransport } from '../../src/server/transport/SerialPortTransport'
import { range } from '../../src/server/generation/randomValues'
import { CLASSES_PATH, IMAGE_ROOT } from '../helpers/catalog'

const PORT_PATH = '/dev/COM11'
const FTP_PORT = 2299

const waitFor = async (predicate: () => boolean, timeoutMs = 5000) => {
  const started = Date.now()
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error('timeout')
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

type MockInternals = { port: { emitData(data: Buffer): void; recording: Buffer } }

describe('SimulatorApp ponta a ponta com serial simulada e FTP real', () => {
  const configDir = mkdtempSync(path.join(tmpdir(), 'wim-app-'))
  const ftpRoot = mkdtempSync(path.join(tmpdir(), 'wim-app-ftp-'))
  let ftp: FtpSrv
  let app: SimulatorApp
  let transport: SerialPortTransport

  beforeAll(async () => {
    copyFileSync(CLASSES_PATH, path.join(configDir, 'classes.json'))
    ftp = new FtpSrv({ url: `ftp://127.0.0.1:${FTP_PORT}`, pasv_url: '127.0.0.1', pasv_min: 2300, pasv_max: 2350, log: bunyan.createLogger({ name: 'ftp', level: 'fatal' }) })
    ftp.on('login', (_data, resolve) => resolve({ root: ftpRoot }))
    await ftp.listen()

    SerialPortMock.binding.reset()
    SerialPortMock.binding.createPort(PORT_PATH, { echo: false, record: true })
    transport = new SerialPortTransport((portPath) => new SerialPortMock({ path: portPath, baudRate: 115200, autoOpen: false }) as unknown as SerialPortLike)

    app = new SimulatorApp({
      repository: new SimulatorRepository(new JsonFileStore(configDir)),
      transport,
      traffic: new TrafficLogger(null),
      imageRoot: IMAGE_ROOT,
      clock: systemClock,
      random: seededRandom(99),
      sleep: realSleep,
      defer: timerDeferrer,
      listPorts: async () => [],
    })
    await app.init()
    app.start()
  })

  afterAll(async () => {
    await app.stop()
    await ftp.close()
    rmSync(configDir, { recursive: true, force: true })
    rmSync(ftpRoot, { recursive: true, force: true })
  })

  it('evento vira imagem no FTP e frame entregue pela serial', async () => {
    await app.updateCamera({
      enabled: true,
      host: '127.0.0.1',
      port: FTP_PORT,
      user: 'tracevia',
      password: 'x',
      rootDir: 'WIM',
      timingMode: 'before-frame',
      delayMs: 200,
      missingPlateChance: 0,
      noPlateNaming: 'unknown',
      uploadEscape: true,
      clockOffsetMs: 0,
    })
    await app.openPort(PORT_PATH)
    const event = await app.createEvent()
    await app.updateEvent({ ...event, classIndex: 75, escapeTimeMs: range(300, 300, false) })

    app.emitEvent(event.id, true)
    await waitFor(() => app.snapshot().queue.length === 1)

    const dayDir = path.join(ftpRoot, 'WIM', 'WIM_01')
    await waitFor(() => existsSync(dayDir) && readdirSync(dayDir).length > 0)
    const files = readdirSync(path.join(dayDir, readdirSync(dayDir)[0]))
    expect(files.some((file) => file.startsWith('PlateWIM_01_'))).toBe(true)
    expect(files.some((file) => /^WIM_01_\d{17}_.+\.jpg$/.test(file))).toBe(true)

    const mock = (transport as unknown as { port: MockInternals }).port.port
    mock.emitData(Buffer.from([0x98]))
    await waitFor(() => mock.recording.length >= 240)
    const payload = mock.recording.subarray(2, 240)
    const decoded = decodePayload(payload)
    expect(decoded).toMatchObject({ classIndex: 75, numAxles: 9, classCode: 'H2' })
    expect(decoded.serial).toBe(app.snapshot().queue[0].serial)

    mock.emitData(Buffer.from([0xb0]))
    await waitFor(() => app.snapshot().queue.length === 0)
    expect(app.snapshot().stats).toMatchObject({ polls: 1, dataResponses: 1, acks: 1, delivered: 1 })

    await waitFor(() => existsSync(path.join(ftpRoot, 'WIM', 'WIM_01_ESCAPE')))
  })

  it('perfil ignorar ACK mantém o frame e reenvia o mesmo serial', async () => {
    await app.setProfile({ behaviorId: 'full-frame', params: {}, ackMode: 'ignore', responseDelayMs: 0, jitterMs: 0 })
    const [event] = app.snapshot().events.slice(-1)
    app.emitEvent(event.id, true)
    await waitFor(() => app.snapshot().queue.length === 1)
    await new Promise((resolve) => setTimeout(resolve, 300))

    const mock = (transport as unknown as { port: MockInternals }).port.port
    const before = mock.recording.length
    mock.emitData(Buffer.from([0x98]))
    await waitFor(() => mock.recording.length >= before + 330)
    mock.emitData(Buffer.from([0xb0, 0x98]))
    await waitFor(() => mock.recording.length >= before + 660)

    const first = mock.recording.subarray(before, before + 330)
    const second = mock.recording.subarray(before + 330, before + 660)
    expect(second.equals(first)).toBe(true)
    expect(app.snapshot().queue[0]).toMatchObject({ sendCount: 2 })
  })

  it('persiste eventos, câmera e cenário no diretório de configuração', async () => {
    await app.saveScenario('integracao')
    expect(existsSync(path.join(configDir, 'events.json'))).toBe(true)
    expect(existsSync(path.join(configDir, 'camera.json'))).toBe(true)
    expect(existsSync(path.join(configDir, 'scenarios', 'integracao.json'))).toBe(true)
    expect((await app.listScenarios()).map((scenario) => scenario.name)).toContain('integracao')
  })
})
