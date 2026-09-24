import type { CameraSettings } from './camera'
import type { EventConfig } from './events'
import type { ResponseProfile } from './scenario'

export interface SimulatorSettings {
  siteId: number
  lastPort: string | null
  equipmentClockOffsetMs: number
  profile: ResponseProfile
}

export type ScenarioCamera = Pick<
  CameraSettings,
  'timingMode' | 'delayMs' | 'missingPlateChance' | 'noPlateNaming' | 'uploadEscape' | 'clockOffsetMs'
>

export interface Scenario {
  name: string
  savedAt: string
  profile: ResponseProfile
  equipmentClockOffsetMs: number
  camera: ScenarioCamera
  events: EventConfig[]
}

export interface ScenarioSummary {
  name: string
  savedAt: string
  events: number
  behaviorId: string
}
