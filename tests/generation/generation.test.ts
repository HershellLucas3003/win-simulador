import { defaultAxleWeightRange, defaultEventConfig } from '../../src/server/generation/eventDefaults'
import { generatePlate, misreadPlate } from '../../src/server/generation/PlateCatalog'
import { listPresets } from '../../src/server/generation/presets'
import type { RandomSource } from '../../src/server/generation/random'
import { pickWeighted, seededRandom } from '../../src/server/generation/random'
import { chance, range, sampleChance, sampleRange } from '../../src/server/generation/randomValues'
import { isOverweight } from '../../src/server/generation/VehicleDraft'
import { VehicleGenerator } from '../../src/server/generation/VehicleGenerator'
import { encodePayload } from '../../src/server/protocol/frameEncoder'
import { FrameStamper } from '../../src/server/equipment/FrameStamper'
import { OffsetClock } from '../../src/server/equipment/OffsetClock'
import { clientCatalog, plateCatalog } from '../helpers/catalog'

const fixed = (value: number): RandomSource => ({ next: () => value })

describe('RandomValue e RandomChance com a semântica do simulate_wim', () => {
  it('sorteia dentro do intervalo inclusivo, inclusive com min e max invertidos', () => {
    const random = seededRandom(1)
    for (let draw = 0; draw < 500; draw += 1) {
      const value = sampleRange(range(900, 100), random)
      expect(value).toBeGreaterThanOrEqual(100)
      expect(value).toBeLessThanOrEqual(900)
    }
  })

  it('sem aleatório ou com min igual a max devolve o segundo valor', () => {
    expect(sampleRange(range(10, 110, false), fixed(0))).toBe(110)
    expect(sampleRange(range(50, 50), fixed(0.99))).toBe(50)
  })

  it('chance "always" ignora o percentual', () => {
    expect(sampleChance(chance(0, true, true), fixed(0.99))).toBe(true)
    expect(sampleChance(chance(100, true, false), fixed(0))).toBe(false)
  })

  it('chance normal compara com o percentual', () => {
    expect(sampleChance(chance(50), fixed(0.49))).toBe(true)
    expect(sampleChance(chance(50), fixed(0.5))).toBe(false)
    expect(sampleChance(chance(0), fixed(0))).toBe(false)
  })

  it('sorteio ponderado respeita os pesos e ignora peso zero', () => {
    const items = [{ id: 'a', w: 0 }, { id: 'b', w: 1 }, { id: 'c', w: 3 }]
    expect(pickWeighted(fixed(0), items, (item) => item.w)?.id).toBe('b')
    expect(pickWeighted(fixed(0.3), items, (item) => item.w)?.id).toBe('c')
  })
})

describe('placas', () => {
  it('placa de fuga troca só o último caractere, como o Rust', () => {
    expect(misreadPlate('0ND668J')).toBe('0ND668K')
    expect(misreadPlate('ABC9')).toBe('ABCA')
    expect(misreadPlate('AB-')).toBe('AB-')
  })

  it('placa gerada tem 7 ou 8 caracteres alfanuméricos', () => {
    const random = seededRandom(3)
    for (let draw = 0; draw < 50; draw += 1) expect(generatePlate(random)).toMatch(/^[A-Z0-9]{7,8}$/)
  })
})

describe('catálogo de classes do cliente', () => {
  const catalog = clientCatalog()

  it('resolve os índices vistos nos logs reais', () => {
    expect(catalog.resolve(77)).toMatchObject({ vehicleClass: { name: 'T 1A', axleCount: 2 }, index: { code: 'I1' } })
    expect(catalog.resolve(33)).toMatchObject({ vehicleClass: { name: 'T 3C', axleCount: 3 }, index: { code: 'B2' } })
    expect(catalog.resolve(75)).toMatchObject({ vehicleClass: { name: 'T 9', axleCount: 9 }, index: { code: 'H2' } })
  })

  it('índices sem mapeamento seguem o histórico do wim_vbv', () => {
    const random = seededRandom(5)
    expect(catalog.axleCountFor(catalog.resolve(110), random)).toBe(2)
    expect(catalog.axleCountFor(catalog.resolve(118), random)).toBe(10)
    expect(catalog.resolve(119).index.kind).toBe('invalid')
    const overflow = catalog.axleCountFor(catalog.resolve(120), random)
    expect(overflow).toBeGreaterThanOrEqual(11)
    expect(overflow).toBeLessThanOrEqual(22)
    expect(catalog.resolve(20992)).toMatchObject({ vehicleClass: null, index: { kind: 'unclassified' } })
  })

  it('peso padrão por eixo vem do limite da classe', () => {
    expect(defaultAxleWeightRange(catalog, 75)).toEqual({ min: 6888, max: 7888, random: true })
    expect(defaultAxleWeightRange(catalog, 77)).toEqual({ min: 300, max: 900, random: true })
  })

  it('excesso de peso por total ou por eixo', () => {
    const vehicleClass = catalog.resolve(33).vehicleClass
    const base = { vehicleClass, axleWeights: [5000, 9000, 9000], gross: 23000 }
    expect(isOverweight(base as never)).toBe(false)
    expect(isOverweight({ ...base, gross: 27501 } as never)).toBe(true)
    expect(isOverweight({ ...base, axleWeights: [5000, 17501, 1] } as never)).toBe(true)
  })
})

describe('VehicleGenerator', () => {
  const catalog = clientCatalog()
  const generator = new VehicleGenerator(catalog, plateCatalog(), seededRandom(11))

  it('gera veículo coerente com a classe e com imagem existente', () => {
    const draft = generator.generate(defaultEventConfig(catalog, 'e', 'T9', 75))
    expect(draft.numAxles).toBe(9)
    expect(draft.axleWeights).toHaveLength(9)
    expect(draft.axleSpacings).toHaveLength(8)
    expect(draft.gross).toBe(draft.axleWeights.reduce((a, b) => a + b, 0))
    expect(draft.length).toBeGreaterThan(draft.axleSpacings.reduce((a, b) => a + b, 0))
    expect(draft.imageFolder).toBe('E9')
    expect(draft.classCode).toBe('H2')
  })

  it('perfil realista escolhe a classe pela distribuição real', () => {
    const counts = new Map<number, number>()
    const config = defaultEventConfig(catalog, 'e', 'real', null)
    for (let draw = 0; draw < 2000; draw += 1) {
      const { classIndex } = generator.generate(config)
      counts.set(classIndex, (counts.get(classIndex) ?? 0) + 1)
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    expect(top).toBe(77)
  })

  it.each(listPresets().map((preset) => preset.id))('preset %s gera frame codificável', (presetId) => {
    const stamper = new FrameStamper(new OffsetClock({ now: () => Date.now() }), seededRandom(2))
    for (let draw = 0; draw < 30; draw += 1) {
      const draft = generator.generate({ ...defaultEventConfig(catalog, 'e', 'p', 44), presetId })
      expect(() => encodePayload(stamper.stamp(draft))).not.toThrow()
      expect(draft.presetId).toBe(presetId)
    }
  })

  it('presets reproduzem os casos do histórico', () => {
    const base = defaultEventConfig(catalog, 'e', 'p', 75)
    expect(generator.generate({ ...base, presetId: 'invalid-reading' })).toMatchObject({ classIndex: 119, gross: 0, speedKmh: 0 })
    expect(generator.generate({ ...base, presetId: 'unclassified' }).classIndex).toBe(117)
    expect(generator.generate({ ...base, presetId: 'over-ten-axles' }).numAxles).toBeGreaterThan(10)
    expect(generator.generate({ ...base, presetId: 'heavy-gross' }).gross).toBeGreaterThan(65535)
    expect(generator.generate({ ...base, presetId: 'axle-mismatch' }).numAxles).not.toBe(9)
    expect(generator.generate({ ...base, presetId: 'negative-temperature' }).temperatureC).toBeLessThan(0)
    const overweight = generator.generate({ ...base, presetId: 'overweight' })
    expect(isOverweight(overweight)).toBe(true)
  })
})

describe('FrameStamper', () => {
  it('serial sequencial, virando de 0xFFFFFFFF para 0', () => {
    const stamper = new FrameStamper(new OffsetClock({ now: () => 0 }), seededRandom(1), { nextSerial: 0xfffffffe, counter134: 0, counter152: 0 })
    const catalog = clientCatalog()
    const draft = new VehicleGenerator(catalog, plateCatalog(), seededRandom(1)).generate(defaultEventConfig(catalog, 'e', 'x', 77))
    expect([stamper.stamp(draft).serial, stamper.stamp(draft).serial, stamper.stamp(draft).serial]).toEqual([0xfffffffe, 0xffffffff, 0])
  })

  it('aplica o desvio de relógio do equipamento no dateStart', () => {
    const base = new Date(2026, 8, 9, 13, 19, 36, 0).getTime()
    const clock = new OffsetClock({ now: () => base }, -206000)
    const catalog = clientCatalog()
    const draft = new VehicleGenerator(catalog, plateCatalog(), seededRandom(1)).generate(defaultEventConfig(catalog, 'e', 'x', 77))
    const reading = new FrameStamper(clock, seededRandom(1)).stamp(draft)
    expect(reading.dateStart).toMatchObject({ hour: 13, minute: 16, second: 10, millisecond: 0 })
  })
})
