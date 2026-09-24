import { defaultEventConfig } from '../../src/server/generation/eventDefaults'
import { seededRandom } from '../../src/server/generation/random'
import { chance, range } from '../../src/server/generation/randomValues'
import { VehicleGenerator } from '../../src/server/generation/VehicleGenerator'
import type { ActiveVehicle } from '../../src/server/scheduler/EventScheduler'
import { EventScheduler } from '../../src/server/scheduler/EventScheduler'
import { clientCatalog, plateCatalog } from '../helpers/catalog'

function setup() {
  let now = 0
  const catalog = clientCatalog()
  const appeared: ActiveVehicle[] = []
  const escaped: ActiveVehicle[] = []
  const scheduler = new EventScheduler({
    clock: { now: () => now },
    random: seededRandom(9),
    generator: new VehicleGenerator(catalog, plateCatalog(), seededRandom(9)),
    onAppear: (vehicle) => appeared.push(vehicle),
    onEscape: (vehicle) => escaped.push(vehicle),
  })
  const base = {
    ...defaultEventConfig(catalog, 'e1', 'Carro', 77),
    appearTimeMs: range(1000, 1000, false),
    escapeTimeMs: range(2000, 2000, false),
  }
  scheduler.setEvents([base])
  const advance = (ms: number) => {
    now += ms
    scheduler.tick()
  }
  return { scheduler, appeared, escaped, advance, base }
}

describe('EventScheduler', () => {
  it('aparece no tempo configurado e foge depois do tempo de fuga', () => {
    const { scheduler, appeared, escaped, advance } = setup()
    scheduler.emit('e1')

    advance(999)
    expect(appeared).toHaveLength(0)
    advance(1)
    expect(appeared).toHaveLength(1)
    advance(1999)
    expect(escaped).toHaveLength(0)
    advance(1)
    expect(escaped).toHaveLength(1)
  })

  it('emissão imediata aparece em 500 ms', () => {
    const { scheduler, appeared, advance } = setup()
    scheduler.emit('e1', { immediate: true })
    advance(500)
    expect(appeared).toHaveLength(1)
  })

  it('veículo sem excesso sempre foge, com excesso depende da chance', () => {
    const { scheduler, base } = setup()
    scheduler.upsert({ ...base, escapeChance: chance(0, true, false) })
    expect(scheduler.emit('e1')?.willEscape).toBe(true)

    scheduler.upsert({ ...base, presetId: 'overweight', classIndex: 33, escapeChance: chance(0, true, false) })
    const overweight = scheduler.emit('e1')
    expect(overweight?.overweight).toBe(true)
    expect(overweight?.willEscape).toBe(false)
  })

  it('rajada espaça as aparições', () => {
    const { scheduler, appeared, advance } = setup()
    expect(scheduler.emitBurst('e1', 3, 200)).toBe(3)
    advance(500)
    expect(appeared).toHaveLength(1)
    advance(400)
    expect(appeared).toHaveLength(3)
  })

  it('emissão automática respeita o intervalo', () => {
    const { scheduler, appeared, advance, base } = setup()
    scheduler.upsert({ ...base, autoEmit: true, autoEmitDelayMs: range(5000, 5000, false), appearTimeMs: range(0, 0, false) })

    advance(0)
    advance(4999)
    expect(appeared).toHaveLength(0)
    advance(1)
    advance(0)
    expect(appeared).toHaveLength(1)
  })

  it('remove o veículo da lista 5 s depois de concluir', () => {
    const { scheduler, advance } = setup()
    scheduler.emit('e1')
    advance(3000)
    expect(scheduler.views()).toHaveLength(1)
    advance(5000)
    expect(scheduler.views()).toHaveLength(0)
  })

  it('progresso vai de 1 a 0 e fase acompanha o ciclo', () => {
    const { scheduler, advance } = setup()
    scheduler.emit('e1')
    expect(scheduler.views()[0]).toMatchObject({ phase: 'waiting', appearProgress: 1 })
    advance(1000)
    expect(scheduler.views()[0]).toMatchObject({ phase: 'escaping', appearProgress: 0 })
    advance(2000)
    expect(scheduler.views()[0].phase).toBe('done')
  })

  it('emitir evento inexistente não gera nada', () => {
    const { scheduler } = setup()
    expect(scheduler.emit('nao-existe')).toBeNull()
  })
})
