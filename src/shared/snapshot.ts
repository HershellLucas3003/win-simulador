import type { CameraSettings, CameraStatus } from './camera'
import type { ClassCatalogData } from './classes'
import type { EquipmentStats, QueuedFrameView, SerialStatus, TrafficEntry } from './equipment'
import type { ActiveVehicleView, EventConfig, PresetDescriptor } from './events'
import type { BehaviorDescriptor } from './scenario'
import type { SimulatorSettings } from './settings'

export type CameraSettingsView = Omit<CameraSettings, 'password'> & { hasPassword: boolean }

export type CameraSettingsInput = Omit<CameraSettings, 'password'> & { password: string | null }

export interface SimulatorSnapshot {
  serial: SerialStatus
  settings: SimulatorSettings
  stats: EquipmentStats
  queue: QueuedFrameView[]
  events: EventConfig[]
  vehicles: ActiveVehicleView[]
  camera: CameraSettingsView
  cameraStatus: CameraStatus
  nextSerial: number
}

export interface SimulatorCatalog {
  behaviors: BehaviorDescriptor[]
  presets: PresetDescriptor[]
  classes: ClassCatalogData
  plateFolders: string[]
}

export type ServerMessage =
  | { type: 'snapshot'; data: SimulatorSnapshot }
  | { type: 'vehicles'; data: ActiveVehicleView[] }
  | { type: 'traffic'; data: TrafficEntry[] }
  | { type: 'traffic-history'; data: TrafficEntry[] }
