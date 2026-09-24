import type { ActiveVehicleView, EventConfig, VehiclePhase } from '../../shared/events'
import type { Clock } from '../events'
import { Signal } from '../events'
import type { RandomSource } from '../generation/random'
import { sampleChance, sampleRange } from '../generation/randomValues'
import type { VehicleDraft } from '../generation/VehicleDraft'
import { isOverweight } from '../generation/VehicleDraft'
import type { VehicleGenerator } from '../generation/VehicleGenerator'

const IMMEDIATE_APPEAR_MS = 500
const RETAIN_AFTER_DONE_MS = 5000

export interface ActiveVehicle {
  id: string
  eventId: string
  draft: VehicleDraft
  startedAt: number
  appearTimeMs: number
  escapeTimeMs: number
  overweight: boolean
  willEscape: boolean
  appeared: boolean
  escaped: boolean
}

export interface EmitOptions {
  immediate?: boolean
  extraDelayMs?: number
  presetId?: string | null
}

export interface EventSchedulerDeps {
  clock: Clock
  random: RandomSource
  generator: VehicleGenerator
  onAppear: (vehicle: ActiveVehicle) => void
  onEscape: (vehicle: ActiveVehicle) => void
}

interface AutoEmitState {
  nextAt: number
}

export class EventScheduler {
  readonly changed = new Signal<void>()
  private configs: EventConfig[] = []
  private vehicles: ActiveVehicle[] = []
  private readonly autoEmit = new Map<string, AutoEmitState>()
  private nextVehicleId = 1

  constructor(private readonly deps: EventSchedulerDeps) {}

  events(): EventConfig[] {
    return this.configs
  }

  setEvents(configs: EventConfig[]): void {
    this.configs = configs
    const ids = new Set(configs.map((config) => config.id))
    for (const id of this.autoEmit.keys()) if (!ids.has(id)) this.autoEmit.delete(id)
    this.vehicles = this.vehicles.filter((vehicle) => ids.has(vehicle.eventId))
    this.changed.emit()
  }

  upsert(config: EventConfig): void {
    const index = this.configs.findIndex((item) => item.id === config.id)
    const next = [...this.configs]
    if (index < 0) next.push(config)
    else next[index] = config
    this.setEvents(next)
  }

  remove(eventId: string): void {
    this.setEvents(this.configs.filter((config) => config.id !== eventId))
  }

  setAutoEmit(eventId: string, enabled: boolean): void {
    const config = this.configs.find((item) => item.id === eventId)
    if (!config || config.autoEmit === enabled) return
    this.autoEmit.delete(eventId)
    this.upsert({ ...config, autoEmit: enabled })
  }

  emit(eventId: string, options: EmitOptions = {}): ActiveVehicle | null {
    const config = this.configs.find((item) => item.id === eventId)
    if (!config) return null
    const effective = options.presetId === undefined ? config : { ...config, presetId: options.presetId }
    const draft = this.deps.generator.generate(effective)
    const overweight = isOverweight(draft)
    const willEscape = !overweight || sampleChance(config.escapeChance, this.deps.random)
    const vehicle: ActiveVehicle = {
      id: String(this.nextVehicleId++),
      eventId,
      draft,
      startedAt: this.deps.clock.now(),
      appearTimeMs: (options.immediate ? IMMEDIATE_APPEAR_MS : sampleRange(config.appearTimeMs, this.deps.random)) + (options.extraDelayMs ?? 0),
      escapeTimeMs: willEscape ? sampleRange(config.escapeTimeMs, this.deps.random) : 0,
      overweight,
      willEscape,
      appeared: false,
      escaped: false,
    }
    this.vehicles.push(vehicle)
    this.changed.emit()
    return vehicle
  }

  emitBurst(eventId: string, count: number, spacingMs: number, presetId?: string | null): number {
    let emitted = 0
    for (let index = 0; index < count; index += 1) {
      if (this.emit(eventId, { immediate: true, extraDelayMs: index * spacingMs, presetId })) emitted += 1
    }
    return emitted
  }

  tick(): void {
    const now = this.deps.clock.now()
    let dirty = this.tickAutoEmit(now)

    for (const vehicle of this.vehicles) {
      const elapsed = now - vehicle.startedAt
      if (!vehicle.appeared && elapsed >= vehicle.appearTimeMs) {
        vehicle.appeared = true
        dirty = true
        this.deps.onAppear(vehicle)
      }
      if (vehicle.willEscape && !vehicle.escaped && elapsed >= vehicle.appearTimeMs + vehicle.escapeTimeMs) {
        vehicle.escaped = true
        dirty = true
        this.deps.onEscape(vehicle)
      }
    }

    const before = this.vehicles.length
    this.vehicles = this.vehicles.filter((vehicle) => now - vehicle.startedAt < this.finishAt(vehicle) + RETAIN_AFTER_DONE_MS)
    if (dirty || before !== this.vehicles.length) this.changed.emit()
  }

  hasActivity(): boolean {
    return this.vehicles.length > 0
  }

  views(): ActiveVehicleView[] {
    const now = this.deps.clock.now()
    return this.vehicles.map((vehicle) => this.view(vehicle, now))
  }

  private tickAutoEmit(now: number): boolean {
    let emitted = false
    for (const config of this.configs) {
      if (!config.autoEmit) continue
      const state = this.autoEmit.get(config.id)
      if (!state) {
        this.autoEmit.set(config.id, { nextAt: now + sampleRange(config.autoEmitDelayMs, this.deps.random) })
        continue
      }
      if (now < state.nextAt) continue
      this.emit(config.id)
      state.nextAt = now + sampleRange(config.autoEmitDelayMs, this.deps.random)
      emitted = true
    }
    return emitted
  }

  private finishAt(vehicle: ActiveVehicle): number {
    return vehicle.willEscape ? vehicle.appearTimeMs + vehicle.escapeTimeMs : vehicle.appearTimeMs
  }

  private view(vehicle: ActiveVehicle, now: number): ActiveVehicleView {
    const elapsed = now - vehicle.startedAt
    const escapeElapsed = Math.max(elapsed - vehicle.appearTimeMs, 0)
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1)
    const phase: VehiclePhase = !vehicle.appeared
      ? 'waiting'
      : vehicle.willEscape && !vehicle.escaped
        ? 'escaping'
        : vehicle.escaped || !vehicle.willEscape
          ? 'done'
          : 'appeared'
    return {
      id: vehicle.id,
      eventId: vehicle.eventId,
      plate: vehicle.draft.plate,
      escapePlate: vehicle.draft.escapePlate,
      classLabel: vehicle.draft.classLabel,
      classIndex: vehicle.draft.classIndex,
      numAxles: vehicle.draft.numAxles,
      gross: vehicle.draft.gross,
      speedKmh: vehicle.draft.speedKmh,
      axleWeights: vehicle.draft.axleWeights,
      axleSpacings: vehicle.draft.axleSpacings,
      overweight: vehicle.overweight,
      willEscape: vehicle.willEscape,
      appearRemainingMs: Math.max(vehicle.appearTimeMs - elapsed, 0),
      escapeRemainingMs: vehicle.willEscape ? Math.max(vehicle.escapeTimeMs - escapeElapsed, 0) : 0,
      appearProgress: 1 - clamp(elapsed / Math.max(vehicle.appearTimeMs, 1)),
      escapeProgress: vehicle.willEscape ? 1 - clamp(escapeElapsed / Math.max(vehicle.escapeTimeMs, 1)) : 0,
      phase,
      presetId: vehicle.draft.presetId,
    }
  }
}
