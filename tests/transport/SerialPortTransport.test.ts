import { SerialPortMock } from 'serialport'
import type { SerialStatus } from '../../src/shared/equipment'
import type { SerialPortLike } from '../../src/server/transport/SerialPortTransport'
import { SerialPortTransport } from '../../src/server/transport/SerialPortTransport'
import { createHarness } from '../helpers/equipmentHarness'
import { REAL_FRAMES } from '../fixtures/realFrames'

const PATH = '/dev/COM11'

const mockFactory = (path: string) => new SerialPortMock({ path, baudRate: 115200, autoOpen: false }) as unknown as SerialPortLike

const waitFor = async (predicate: () => boolean, timeoutMs = 1000) => {
  const started = Date.now()
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error('timeout')
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

describe('SerialPortTransport com porta simulada', () => {
  beforeEach(() => {
    SerialPortMock.binding.reset()
    SerialPortMock.binding.createPort(PATH, { echo: false, record: true })
  })

  it('abre, publica status e fecha', async () => {
    const transport = new SerialPortTransport(mockFactory)
    const statuses: SerialStatus[] = []
    transport.statusChanged.subscribe((status) => statuses.push(status))

    await transport.open(PATH)
    expect(transport.isOpen()).toBe(true)
    await transport.close()

    expect(statuses.map((status) => status.open)).toEqual([true, false])
  })

  it('porta inexistente devolve erro e deixa status com a mensagem', async () => {
    const transport = new SerialPortTransport(mockFactory)
    await expect(transport.open('/dev/COM99')).rejects.toThrow()
    expect(transport.currentStatus()).toMatchObject({ open: false, path: '/dev/COM99' })
    expect(transport.currentStatus().error).toBeTruthy()
    await transport.close()
  })

  it('fechar durante uma tentativa de abertura mantém o status fechado', async () => {
    const transport = new SerialPortTransport(mockFactory)
    const opening = transport.open('/dev/COM99').catch(() => undefined)
    await transport.close()
    await opening
    expect(transport.currentStatus()).toEqual({ open: false, path: null, error: null })
  })

  it('fechar enquanto a porta está abrindo não deixa a porta aberta', async () => {
    const transport = new SerialPortTransport(mockFactory)
    const opening = transport.open(PATH).catch(() => undefined)
    await transport.close()
    await opening
    expect(transport.isOpen()).toBe(false)
    expect(transport.currentStatus().open).toBe(false)
  })

  it('ciclo completo poll -> frame -> ACK pela porta', async () => {
    const transport = new SerialPortTransport(mockFactory)
    const { controller, queue, enqueue } = createHarness()
    transport.data.subscribe((bytes) => void controller.receive(bytes))
    await transport.open(PATH)
    controller.attach(transport)
    enqueue(REAL_FRAMES[1].reading)

    const port = (transport as unknown as { port: { port: { emitData(data: Buffer): void; recording: Buffer } } }).port.port
    port.emitData(Buffer.from([0x98]))
    await waitFor(() => port.recording.length >= 240)
    port.emitData(Buffer.from([0xb0]))
    await waitFor(() => queue.size() === 0)

    expect(port.recording.subarray(0, 2).toString('hex')).toBe('ff06')
    expect(port.recording.readUInt32LE(2 + 4)).toBe(REAL_FRAMES[1].reading.serial)
    await transport.close()
  })
})
