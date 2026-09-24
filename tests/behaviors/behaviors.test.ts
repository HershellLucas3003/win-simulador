import { createBehavior, listBehaviors, normalizeProfile } from '../../src/server/behaviors/behaviorRegistry'
import { seededRandom } from '../../src/server/generation/random'
import { buildDataFrame, encodePayload } from '../../src/server/protocol/frameEncoder'
import { decodePayload } from '../../src/server/protocol/frameDecoder'
import { DEFAULT_RESPONSE_PROFILE } from '../../src/shared/scenario'
import { REAL_FRAMES } from '../fixtures/realFrames'

const frame = buildDataFrame(encodePayload(REAL_FRAMES[0].reading))
const random = seededRandom(7)

const planFor = (behaviorId: string, params: Record<string, number> = {}, pendingFrame: Buffer | null = frame) =>
  createBehavior({ ...DEFAULT_RESPONSE_PROFILE, behaviorId, params }).respond({ pendingFrame, random })

const sizes = (plan: ReturnType<typeof planFor>) => plan.chunks.map((chunk) => chunk.bytes.length)
const joined = (plan: ReturnType<typeof planFor>) => Buffer.concat(plan.chunks.map((chunk) => chunk.bytes))

describe('comportamentos de resposta', () => {
  it('todos respondem FF 15 sem frame pendente, exceto o mudo e o lixo na linha', () => {
    for (const { id } of listBehaviors()) {
      const plan = planFor(id, {}, null)
      expect(plan.deliversData).toBe(false)
      if (id === 'mute') expect(plan.chunks).toHaveLength(0)
      else expect(joined(plan).subarray(-2).toString('hex')).toBe('ff15')
    }
  })

  it('frame completo manda 330 bytes de uma vez', () => {
    expect(sizes(planFor('full-frame'))).toEqual([330])
  })

  it('equipamento real permite ajustar o ponto de parada', () => {
    expect(sizes(planFor('real-equipment', { frameSize: 100 }))).toEqual([2, 98])
    expect(sizes(planFor('real-equipment', { frameSize: 2 }))).toEqual([2])
  })

  it('frame picado divide no tamanho pedido e aplica o atraso a partir do segundo pedaco', () => {
    const plan = planFor('chunked', { frameSize: 100, chunkSize: 40, delayMs: 500 })
    expect(sizes(plan)).toEqual([40, 40, 20])
    expect(plan.chunks.map((chunk) => chunk.delayMs)).toEqual([0, 500, 500])
  })

  it('cabecalho invalido troca so o segundo byte', () => {
    const bytes = joined(planFor('invalid-header', { secondByte: 0x07 }))
    expect(bytes.subarray(0, 2).toString('hex')).toBe('ff07')
    expect(bytes.subarray(2).equals(frame.subarray(2, 240))).toBe(true)
  })

  it('lixo na linha antecede o frame valido', () => {
    const plan = planFor('garbage-prefix', { count: 5 })
    expect(plan.chunks[0].bytes.length).toBe(5)
    expect(Buffer.concat(plan.chunks.slice(1).map((chunk) => chunk.bytes)).equals(frame.subarray(0, 240))).toBe(true)
  })

  it('frame desalinhado produz os valores absurdos vistos em producao', () => {
    const payload = joined(planFor('misaligned', { lostBytes: 1 })).subarray(2)
    const decoded = decodePayload(payload)
    expect(decoded.numAxles).not.toBe(REAL_FRAMES[0].reading.numAxles)
    expect(decoded.classIndex).toBeGreaterThan(255)
  })

  it('bytes corrompidos preservam o cabecalho e alteram o payload', () => {
    const bytes = joined(planFor('corrupt-bytes', { count: 4 }))
    expect(bytes.subarray(0, 2).toString('hex')).toBe('ff06')
    expect(bytes.equals(frame.subarray(0, 240))).toBe(false)
  })

  it('normaliza parametros fora do intervalo e comportamento desconhecido', () => {
    const profile = normalizeProfile({ ...DEFAULT_RESPONSE_PROFILE, behaviorId: 'nao-existe', params: { frameSize: 9999 }, responseDelayMs: -5 })
    expect(profile.behaviorId).toBe('real-equipment')
    expect(profile.params.frameSize).toBe(330)
    expect(profile.responseDelayMs).toBe(0)
  })
})
