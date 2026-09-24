export type FrameSource = 'generated' | 'manual' | 'replay'

export interface QueuedFrameView {
  id: string
  serial: number
  classIndex: number
  classCode: string
  plate: string
  numAxles: number
  gross: number
  speedKmh: number
  source: FrameSource
  presetId: string | null
  enqueuedAt: string
  sendCount: number
  awaitingAck: boolean
}

export interface EquipmentStats {
  polls: number
  emptyResponses: number
  dataResponses: number
  acks: number
  ignoredAcks: number
  unexpectedAcks: number
  unknownBytes: number
  delivered: number
}

export type TrafficKind = 'rx' | 'tx' | 'info' | 'warn' | 'error'

export interface TrafficEntry {
  seq: number
  at: string
  kind: TrafficKind
  message: string
  hex: string | null
  isPoll: boolean
}

export interface SerialStatus {
  open: boolean
  path: string | null
  error: string | null
}

export interface SerialPortInfo {
  path: string
  manufacturer: string | null
  friendlyName: string | null
}

export const EMPTY_STATS: EquipmentStats = {
  polls: 0,
  emptyResponses: 0,
  dataResponses: 0,
  acks: 0,
  ignoredAcks: 0,
  unexpectedAcks: 0,
  unknownBytes: 0,
  delivered: 0,
}
