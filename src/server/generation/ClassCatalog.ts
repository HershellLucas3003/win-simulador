import type { ClassCatalogData, ClassIndexInfo, ResolvedClassIndex, VehicleClassInfo } from '../../shared/classes'
import type { RandomSource } from './random'
import { pickWeighted, randomInt } from './random'

const INVALID_AXLES = { min: 2, max: 9 }
const OVERFLOW_AXLES = { min: 11, max: 22 }
const UNKNOWN_AXLES = 2

const KIND_LABEL: Record<ClassIndexInfo['kind'], string> = {
  mapped: '',
  unclassified: 'Sem classe',
  invalid: 'Leitura inválida',
  overflow: '11+ eixos',
}

export class ClassCatalog {
  private readonly classesById: Map<number, VehicleClassInfo>
  private readonly indexesByValue: Map<number, ClassIndexInfo>

  constructor(private readonly source: ClassCatalogData) {
    this.classesById = new Map(source.classes.map((item) => [item.id, item]))
    this.indexesByValue = new Map(source.indexes.map((item) => [item.classIndex, item]))
  }

  data(): ClassCatalogData {
    return this.source
  }

  resolve(classIndex: number): ResolvedClassIndex {
    const index = this.indexesByValue.get(classIndex) ?? {
      classIndex,
      classId: null,
      kind: 'unclassified' as const,
      code: '',
      weight: 0,
      axleCount: null,
    }
    const vehicleClass = index.classId === null ? null : this.classesById.get(index.classId) ?? null
    const label = vehicleClass
      ? `${vehicleClass.name} (${classIndex})`
      : `${KIND_LABEL[index.kind] || 'Sem classe'} (${classIndex})`
    return { index, vehicleClass, label }
  }

  axleCountFor(resolved: ResolvedClassIndex, random: RandomSource): number {
    if (resolved.vehicleClass) return resolved.vehicleClass.axleCount
    if (resolved.index.axleCount !== null) return resolved.index.axleCount
    if (resolved.index.kind === 'invalid') return randomInt(random, INVALID_AXLES.min, INVALID_AXLES.max)
    if (resolved.index.kind === 'overflow') return randomInt(random, OVERFLOW_AXLES.min, OVERFLOW_AXLES.max)
    return UNKNOWN_AXLES
  }

  imageFolderFor(resolved: ResolvedClassIndex, axleCount: number): string | null {
    return resolved.vehicleClass?.imageFolder ?? this.source.imageFolderByAxles[String(axleCount)] ?? null
  }

  unclassifiedIndexFor(axleCount: number): number | null {
    const match = this.source.indexes.find((item) => item.kind === 'unclassified' && item.axleCount === axleCount)
    return match?.classIndex ?? null
  }

  indexOfKind(kind: ClassIndexInfo['kind']): number | null {
    return this.source.indexes.find((item) => item.kind === kind)?.classIndex ?? null
  }

  weightedIndex(random: RandomSource): number {
    return pickWeighted(random, this.source.indexes, (item) => item.weight)?.classIndex ?? this.source.indexes[0].classIndex
  }

  firstMappedIndex(): number {
    return this.source.indexes.find((item) => item.kind === 'mapped')?.classIndex ?? this.source.indexes[0].classIndex
  }
}
