import type { EventConfig, RandomChance, RandomRange } from '../../shared/events'
import type { ClassCatalog } from '../generation/ClassCatalog'
import { defaultEventConfig } from '../generation/eventDefaults'

type RustRange = [number, number, boolean]
type RustChance = [number, boolean, boolean]

interface RustEventConfig {
  name?: string
  class?: number
  appear_time?: RustRange
  escape_time?: RustRange
  speed?: RustRange
  axle_weight?: RustRange
  axle_distance?: RustRange
  different_plate_chance?: RustChance
  escape_chance?: RustChance
  auto_emit?: boolean
  auto_emit_delay?: RustRange
}

const toRange = (value: RustRange | undefined, fallback: RandomRange): RandomRange =>
  Array.isArray(value) && value.length === 3 ? { min: Number(value[0]), max: Number(value[1]), random: Boolean(value[2]) } : fallback

const toChance = (value: RustChance | undefined, fallback: RandomChance): RandomChance =>
  Array.isArray(value) && value.length === 3
    ? { percent: Number(value[0]), always: Boolean(value[1]), alwaysValue: Boolean(value[2]) }
    : fallback

export function importRustConfig(json: unknown, catalog: ClassCatalog, nextId: () => string): EventConfig[] {
  if (!Array.isArray(json)) throw new Error('o config.json do simulate_wim deve ser uma lista de eventos')

  return json.map((raw: RustEventConfig, index) => {
    const classIndex = typeof raw.class === 'number' ? raw.class : catalog.firstMappedIndex()
    const base = defaultEventConfig(catalog, nextId(), raw.name?.trim() || `Evento ${index + 1}`, classIndex)
    return {
      ...base,
      appearTimeMs: toRange(raw.appear_time, base.appearTimeMs),
      escapeTimeMs: toRange(raw.escape_time, base.escapeTimeMs),
      speedKmh: toRange(raw.speed, base.speedKmh),
      axleWeightKg: toRange(raw.axle_weight, base.axleWeightKg),
      axleDistanceCm: toRange(raw.axle_distance, base.axleDistanceCm),
      differentPlateChance: toChance(raw.different_plate_chance, base.differentPlateChance),
      escapeChance: toChance(raw.escape_chance, base.escapeChance),
      autoEmit: Boolean(raw.auto_emit),
      autoEmitDelayMs: toRange(raw.auto_emit_delay, base.autoEmitDelayMs),
    }
  })
}
