import { ACK_BYTE, POLL_BYTE } from '../../src/server/protocol/constants'
import { REAL_FRAMES, capturedFrameAtLine } from '../fixtures/realFrames'
import { createHarness } from '../helpers/equipmentHarness'

const poll = Buffer.from([POLL_BYTE])
const ack = Buffer.from([ACK_BYTE])

describe('EquipmentController', () => {
  it('responde FF 15 quando a fila esta vazia', async () => {
    const { controller, channel } = createHarness()

    await controller.receive(poll)

    expect(channel.take().toString('hex')).toBe('ff15')
    expect(controller.currentStats()).toMatchObject({ polls: 1, emptyResponses: 1, dataResponses: 0 })
  })

  it('no perfil padrao envia 240 bytes em dois pedacos, igual ao equipamento real', async () => {
    const { controller, channel, enqueue } = createHarness()
    enqueue(REAL_FRAMES[0].reading)

    await controller.receive(poll)

    expect(channel.writes.map((chunk) => chunk.length)).toEqual([2, 238])
    expect(channel.take().toString('hex')).toBe(capturedFrameAtLine(REAL_FRAMES[0].frameLine).toString('hex'))
  })

  it('reenvia o mesmo serial enquanto nao recebe ACK', async () => {
    const { controller, channel, queue, enqueue } = createHarness()
    enqueue()

    await controller.receive(poll)
    const first = channel.take()
    await controller.receive(poll)
    const second = channel.take()

    expect(second.equals(first)).toBe(true)
    expect(queue.head()?.sendCount).toBe(2)
  })

  it('remove o frame da fila ao receber ACK e volta a responder FF 15', async () => {
    const { controller, channel, queue, enqueue } = createHarness()
    enqueue()
    const delivered: number[] = []
    controller.delivered.subscribe((frame) => delivered.push(frame.serial))

    await controller.receive(poll)
    await controller.receive(ack)
    channel.take()
    await controller.receive(poll)

    expect(queue.size()).toBe(0)
    expect(delivered).toEqual([REAL_FRAMES[0].reading.serial])
    expect(channel.take().toString('hex')).toBe('ff15')
  })

  it('entrega a fila em ordem, um frame por ciclo de poll e ACK', async () => {
    const { controller, channel, enqueue } = createHarness({ behaviorId: 'full-frame' })
    REAL_FRAMES.forEach(({ reading }) => enqueue(reading))
    const serials: number[] = []

    for (let cycle = 0; cycle < REAL_FRAMES.length; cycle += 1) {
      await controller.receive(poll)
      serials.push(channel.take().readUInt32LE(2 + 4))
      await controller.receive(ack)
    }

    expect(serials).toEqual(REAL_FRAMES.map(({ reading }) => reading.serial))
  })

  it('ACK sem frame enviado nao remove nada e fica registrado', async () => {
    const { controller, queue, enqueue } = createHarness()
    enqueue()

    await controller.receive(ack)

    expect(queue.size()).toBe(1)
    expect(controller.currentStats().unexpectedAcks).toBe(1)
  })

  it('no modo ignorar ACK o frame continua na fila e e reenviado', async () => {
    const { controller, queue, enqueue } = createHarness({ ackMode: 'ignore' })
    enqueue()

    await controller.receive(poll)
    await controller.receive(ack)
    await controller.receive(poll)

    expect(queue.size()).toBe(1)
    expect(queue.head()?.sendCount).toBe(2)
    expect(controller.currentStats().ignoredAcks).toBe(1)
  })

  it('processa poll e ACK que chegam no mesmo pacote', async () => {
    const { controller, queue, enqueue } = createHarness()
    enqueue()

    await controller.receive(Buffer.from([POLL_BYTE, ACK_BYTE, POLL_BYTE]))

    expect(queue.size()).toBe(0)
    expect(controller.currentStats()).toMatchObject({ polls: 2, dataResponses: 1, emptyResponses: 1, acks: 1 })
  })

  it('byte desconhecido e contado e nao gera resposta', async () => {
    const { controller, channel } = createHarness()

    await controller.receive(Buffer.from([0x42]))

    expect(channel.writes).toHaveLength(0)
    expect(controller.currentStats().unknownBytes).toBe(1)
  })

  it('equipamento mudo nao escreve nada', async () => {
    const { controller, channel, enqueue } = createHarness({ behaviorId: 'mute' })
    enqueue()

    await controller.receive(poll)

    expect(channel.writes).toHaveLength(0)
  })

  it('aborta a resposta se a porta fechar no meio', async () => {
    const { controller, channel, traffic, enqueue } = createHarness()
    enqueue()
    channel.open = false

    await controller.receive(poll)

    expect(channel.writes).toHaveLength(0)
    expect(traffic.entries.some((entry) => entry.kind === 'warn')).toBe(true)
  })

  it('ao reconectar o frame pendente volta a aguardar um novo envio', async () => {
    const { controller, queue, enqueue } = createHarness()
    enqueue()
    await controller.receive(poll)

    controller.attach(null)

    expect(queue.head()?.awaitingAck).toBe(false)
  })
})
