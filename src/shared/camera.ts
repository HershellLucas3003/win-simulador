export type CameraTimingMode = 'before-frame' | 'after-frame' | 'none'
export type NoPlateNaming = 'unknown' | 'empty'

export interface CameraSettings {
  enabled: boolean
  host: string
  port: number
  user: string
  password: string
  rootDir: string
  timingMode: CameraTimingMode
  delayMs: number
  missingPlateChance: number
  noPlateNaming: NoPlateNaming
  uploadEscape: boolean
  clockOffsetMs: number
}

export interface CameraStatus {
  connected: boolean
  lastError: string | null
  uploads: number
  failures: number
  lastUpload: string | null
}

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  enabled: false,
  host: '127.0.0.1',
  port: 21,
  user: 'tracevia',
  password: '',
  rootDir: 'WIM',
  timingMode: 'before-frame',
  delayMs: 1500,
  missingPlateChance: 0,
  noPlateNaming: 'unknown',
  uploadEscape: true,
  clockOffsetMs: 0,
}
