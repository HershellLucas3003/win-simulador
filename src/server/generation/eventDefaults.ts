import type { EventConfig } from '../../shared/events'
import type { ClassCatalog } from './ClassCatalog'
import { chance, range } from './randomValues'

const AXLE_WEIGHT_SPREAD = 500
const LIGHT_VEHICLE_AXLE_WEIGHT = range(300, 900)

export function defaultAxleWeightRange(catalog: ClassCatalog, classIndex: number) {
  const vehicleClass = catalog.resolve(classIndex).vehicleClass
  if (!vehicleClass || vehicleClass.maxWeight <= 0) return LIGHT_VEHICLE_AXLE_WEIGHT
  const perAxle = Math.min(Math.floor(vehicleClass.maxWeight / vehicleClass.axleCount), vehicleClass.maxAxle || Number.MAX_SAFE_INTEGER)
  return range(Math.max(perAxle - AXLE_WEIGHT_SPREAD, 0), perAxle + AXLE_WEIGHT_SPREAD)
}

export function defaultEventConfig(
  catalog: ClassCatalog,
  id: string,
  name: string,
  classIndex: number | null = catalog.firstMappedIndex(),
): EventConfig {
  return {
    id,
    name,
    classIndex,
    presetId: null,
    lane: range(1, 1, false),
    appearTimeMs: range(5000, 10000),
    escapeTimeMs: range(5000, 10000),
    speedKmh: range(40, 120),
    axleWeightKg: defaultAxleWeightRange(catalog, classIndex ?? catalog.firstMappedIndex()),
    axleDistanceCm: range(130, 560),
    temperatureC: range(42, 42, false),
    differentPlateChance: chance(0),
    escapeChance: chance(50),
    autoEmit: false,
    autoEmitDelayMs: range(45000, 120000),
  }
}
