export type ClassIndexKind = 'mapped' | 'unclassified' | 'invalid' | 'overflow'

export interface VehicleClassInfo {
  id: number
  name: string
  axleCount: number
  maxWeight: number
  maxAxle: number
  axleTypes: string[]
  imageFolder: string | null
}

export interface ClassIndexInfo {
  classIndex: number
  classId: number | null
  kind: ClassIndexKind
  code: string
  weight: number
  axleCount: number | null
}

export interface ClassCatalogData {
  classes: VehicleClassInfo[]
  indexes: ClassIndexInfo[]
  imageFolderByAxles: Record<string, string>
}

export interface ResolvedClassIndex {
  index: ClassIndexInfo
  vehicleClass: VehicleClassInfo | null
  label: string
}
