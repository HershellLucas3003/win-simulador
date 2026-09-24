import type { EventConfig } from '../../shared/events'
import type { ClassCatalog } from './ClassCatalog'
import { defaultAxleWeightRange } from './eventDefaults'
import type { PlateCatalog } from './PlateCatalog'
import { misreadPlate } from './PlateCatalog'
import { applyPreset } from './presets'
import type { RandomSource } from './random'
import { randomInt } from './random'
import { sampleChance, sampleRange } from './randomValues'
import type { VehicleDraft } from './VehicleDraft'
import { withAxles } from './VehicleDraft'

const OVERHANG_CM = { min: 120, max: 260 }

export class VehicleGenerator {
  constructor(
    private readonly catalog: ClassCatalog,
    private readonly plates: PlateCatalog,
    private readonly random: RandomSource,
  ) {}

  generate(eventConfig: EventConfig): VehicleDraft {
    const config = this.withResolvedClass(eventConfig)
    const classIndex = config.classIndex ?? this.catalog.firstMappedIndex()
    const resolved = this.catalog.resolve(classIndex)
    const numAxles = this.catalog.axleCountFor(resolved, this.random)
    const imageFolder = this.catalog.imageFolderFor(resolved, numAxles)
    const plate = this.plates.pickPlate(imageFolder, this.random)

    const weights = Array.from({ length: numAxles }, () => sampleRange(config.axleWeightKg, this.random))
    const spacings = Array.from({ length: Math.max(numAxles - 1, 0) }, () => sampleRange(config.axleDistanceCm, this.random))

    const base: VehicleDraft = {
      classIndex,
      classCode: resolved.index.code,
      classLabel: resolved.label,
      imageFolder,
      vehicleClass: resolved.vehicleClass,
      numAxles,
      lane: sampleRange(config.lane, this.random),
      speedKmh: sampleRange(config.speedKmh, this.random),
      axleWeights: [],
      axleSpacings: [],
      length: 0,
      gross: 0,
      temperatureC: sampleRange(config.temperatureC, this.random),
      plate,
      escapePlate: sampleChance(config.differentPlateChance, this.random) ? misreadPlate(plate) : null,
      presetId: null,
    }

    const draft = withAxles(base, weights, spacings, randomInt(this.random, OVERHANG_CM.min, OVERHANG_CM.max))
    return applyPreset(config.presetId, draft, { random: this.random, catalog: this.catalog })
  }

  private withResolvedClass(config: EventConfig): EventConfig {
    if (config.classIndex !== null) return config
    const classIndex = this.catalog.weightedIndex(this.random)
    return { ...config, classIndex, axleWeightKg: defaultAxleWeightRange(this.catalog, classIndex) }
  }
}
