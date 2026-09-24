import type { PresetDescriptor } from '../../shared/events'
import type { ClassCatalog } from './ClassCatalog'
import type { RandomSource } from './random'
import { randomInt } from './random'
import type { VehicleDraft } from './VehicleDraft'
import { withAxles } from './VehicleDraft'

export interface PresetContext {
  random: RandomSource
  catalog: ClassCatalog
}

export interface VehiclePreset {
  descriptor: PresetDescriptor
  apply(draft: VehicleDraft, context: PresetContext): VehicleDraft
}

const U16_SAFE_AXLE = 60000
const DEFAULT_OVERHANG = 180

const spacingsFor = (count: number, random: RandomSource) =>
  Array.from({ length: Math.max(count - 1, 0) }, () => randomInt(random, 120, 560))

const weightsFor = (count: number, random: RandomSource, min: number, max: number) =>
  Array.from({ length: count }, () => randomInt(random, min, max))

const reclassify = (draft: VehicleDraft, classIndex: number | null, context: PresetContext): VehicleDraft => {
  if (classIndex === null) return draft
  const resolved = context.catalog.resolve(classIndex)
  return { ...draft, classIndex, classCode: resolved.index.code, classLabel: resolved.label, vehicleClass: resolved.vehicleClass }
}

const PRESETS: VehiclePreset[] = [
  {
    descriptor: { id: 'overweight', label: 'Excesso de peso', description: 'Peso bruto 10 a 30% acima do limite da classe.' },
    apply(draft, { random }) {
      const limit = draft.vehicleClass?.maxWeight ?? 0
      if (limit <= 0) return draft
      const target = Math.round(limit * (1.1 + random.next() * 0.2))
      const perAxle = Math.min(Math.ceil(target / draft.numAxles), U16_SAFE_AXLE)
      const weights = draft.axleWeights.map(() => perAxle)
      return withAxles(draft, weights, draft.axleSpacings, draft.length - draft.axleSpacings.reduce((a, b) => a + b, 0))
    },
  },
  {
    descriptor: { id: 'heavy-gross', label: 'Peso acima de 65535', description: 'Gross maior que u16, como os 89240 kg do log real. Quebra quem ainda lê gross como u16.' },
    apply(draft, { random }) {
      const target = randomInt(random, 70000, 171070)
      const perAxle = Math.min(Math.ceil(target / draft.numAxles), U16_SAFE_AXLE)
      return withAxles(draft, draft.axleWeights.map(() => perAxle), draft.axleSpacings, DEFAULT_OVERHANG)
    },
  },
  {
    descriptor: { id: 'unclassified', label: 'Índice sem mapeamento', description: 'Índice 110-118 (não classificado por eixos), gravado em produção com classe "0".' },
    apply(draft, context) {
      return reclassify(draft, context.catalog.unclassifiedIndexFor(draft.numAxles) ?? context.catalog.indexOfKind('unclassified'), context)
    },
  },
  {
    descriptor: { id: 'invalid-reading', label: 'Leitura inválida (119)', description: 'Índice 119 com pesos e velocidade zerados, como 106 mil registros do wim_vbv.' },
    apply(draft, context) {
      const zeroed = withAxles(draft, draft.axleWeights.map(() => 0), draft.axleSpacings, DEFAULT_OVERHANG)
      return reclassify({ ...zeroed, speedKmh: 0 }, context.catalog.indexOfKind('invalid'), context)
    },
  },
  {
    descriptor: { id: 'over-ten-axles', label: 'Mais de 10 eixos', description: 'Índice 120 com 11 a 22 eixos. O frame só carrega 10 pesos e 9 espaçamentos.' },
    apply(draft, context) {
      const axles = randomInt(context.random, 11, 22)
      const weights = weightsFor(axles, context.random, 3000, 9000)
      return reclassify(withAxles(draft, weights, spacingsFor(axles, context.random), DEFAULT_OVERHANG), context.catalog.indexOfKind('overflow'), context)
    },
  },
  {
    descriptor: { id: 'axle-mismatch', label: 'Classe incoerente com eixos', description: 'Mantém a classe mas muda o número de eixos, como o índice 71 (T 8) com 2 eixos.' },
    apply(draft, { random }) {
      const options = [2, 3, 4, 5, 6, 7, 8, 9].filter((count) => count !== draft.numAxles)
      const axles = options[randomInt(random, 0, options.length - 1)]
      return withAxles(draft, weightsFor(axles, random, 800, 9000), spacingsFor(axles, random), DEFAULT_OVERHANG)
    },
  },
  {
    descriptor: { id: 'negative-temperature', label: 'Temperatura negativa', description: 'Temperatura entre -20 e -1 °C, testa o cast para short do decoder.' },
    apply(draft, { random }) {
      return { ...draft, temperatureC: randomInt(random, -20, -1) }
    },
  },
  {
    descriptor: { id: 'zero-speed', label: 'Velocidade zero', description: 'Velocidade 0, comum no histórico real.' },
    apply(draft) {
      return { ...draft, speedKmh: 0 }
    },
  },
]

const BY_ID = new Map(PRESETS.map((preset) => [preset.descriptor.id, preset]))

export function listPresets(): PresetDescriptor[] {
  return PRESETS.map((preset) => preset.descriptor)
}

export function applyPreset(presetId: string | null, draft: VehicleDraft, context: PresetContext): VehicleDraft {
  const preset = presetId ? BY_ID.get(presetId) : undefined
  return preset ? { ...preset.apply(draft, context), presetId: preset.descriptor.id } : draft
}
