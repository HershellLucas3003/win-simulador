import type { CameraSettings } from '../../shared/camera'
import type { SerialPortInfo, TrafficEntry } from '../../shared/equipment'
import type { ActiveVehicleView, EventConfig } from '../../shared/events'
import type { ReplayFrameView } from '../../shared/replay'
import type { ResponseProfile } from '../../shared/scenario'
import type { Scenario, ScenarioSummary, SimulatorSettings } from '../../shared/settings'
import type { CameraSettingsInput, CameraSettingsView, SimulatorCatalog, SimulatorSnapshot } from '../../shared/snapshot'
import { listBehaviors, normalizeProfile } from '../behaviors/behaviorRegistry'
import { CameraService } from '../camera/CameraService'
import type { Deferrer } from '../camera/CameraTiming'
import { FtpCameraStorage } from '../camera/FtpCameraStorage'
import { importRustConfig } from '../config/rustConfigImporter'
import type { SimulatorRepository } from '../config/SimulatorRepository'
import { isValidScenarioName } from '../config/SimulatorRepository'
import { ValidationError, validateCamera, validateEvent, validateSerialNumber, validateSiteAndClock } from '../config/validators'
import { EquipmentController } from '../equipment/EquipmentController'
import { FrameQueue } from '../equipment/FrameQueue'
import { FrameStamper } from '../equipment/FrameStamper'
import { OffsetClock } from '../equipment/OffsetClock'
import type { Clock, Sleeper } from '../events'
import { Signal } from '../events'
import { ClassCatalog } from '../generation/ClassCatalog'
import { defaultEventConfig } from '../generation/eventDefaults'
import { PlateCatalog } from '../generation/PlateCatalog'
import { listPresets } from '../generation/presets'
import type { RandomSource } from '../generation/random'
import { VehicleGenerator } from '../generation/VehicleGenerator'
import type { TrafficLogger } from '../logging/TrafficLogger'
import type { ParsedLogFrame } from '../replay/LogFrameParser'
import { parseLogFrames } from '../replay/LogFrameParser'
import { EventScheduler } from '../scheduler/EventScheduler'
import type { SerialPortTransport } from '../transport/SerialPortTransport'
import { VehiclePipeline } from './VehiclePipeline'

const TICK_MS = 100
const SNAPSHOT_DEBOUNCE_MS = 200
const VEHICLE_BROADCAST_MS = 250
const STAMPER_SAVE_DEBOUNCE_MS = 1000
const MAX_BURST = 200

export interface SimulatorAppDeps {
  repository: SimulatorRepository
  transport: SerialPortTransport
  traffic: TrafficLogger
  imageRoot: string
  clock: Clock
  random: RandomSource
  sleep: Sleeper
  defer: Deferrer
  listPorts: () => Promise<SerialPortInfo[]>
}

export class SimulatorApp {
  readonly snapshotChanged = new Signal<SimulatorSnapshot>()
  readonly vehiclesChanged = new Signal<ActiveVehicleView[]>()
  readonly trafficAdded: Signal<TrafficEntry>

  private settings!: SimulatorSettings
  private camera!: CameraSettings
  private catalog!: ClassCatalog
  private plates!: PlateCatalog
  private scheduler!: EventScheduler
  private stamper!: FrameStamper
  private controller!: EquipmentController
  private cameraService!: CameraService
  private storage!: FtpCameraStorage
  private pipeline!: VehiclePipeline
  private readonly queue = new FrameQueue()
  private readonly equipmentClock: OffsetClock
  private replayFrames: ParsedLogFrame[] = []
  private nextEventId = 1
  private timers: NodeJS.Timeout[] = []
  private snapshotTimer: NodeJS.Timeout | null = null
  private stamperTimer: NodeJS.Timeout | null = null

  constructor(private readonly deps: SimulatorAppDeps) {
    this.trafficAdded = deps.traffic.entry
    this.equipmentClock = new OffsetClock(deps.clock)
  }

  async init(): Promise<void> {
    const { repository } = this.deps
    this.settings = await repository.loadSettings()
    this.settings.profile = normalizeProfile(this.settings.profile)
    this.camera = await repository.loadCamera()
    this.catalog = new ClassCatalog(await repository.loadClasses())
    this.plates = new PlateCatalog(this.deps.imageRoot)
    this.equipmentClock.setOffset(this.settings.equipmentClockOffsetMs)
    this.stamper = new FrameStamper(this.equipmentClock, this.deps.random, await repository.loadStamperState())

    this.storage = new FtpCameraStorage(this.camera)
    this.cameraService = new CameraService({
      storage: this.storage,
      plates: this.plates,
      traffic: this.deps.traffic,
      random: this.deps.random,
      clock: this.deps.clock,
      settings: () => this.camera,
      siteId: () => this.settings.siteId,
    })

    this.controller = new EquipmentController({
      queue: this.queue,
      traffic: this.deps.traffic,
      sleep: this.deps.sleep,
      random: this.deps.random,
      profile: this.settings.profile,
    })

    this.pipeline = new VehiclePipeline({
      queue: this.queue,
      stamper: this.stamper,
      camera: this.cameraService,
      traffic: this.deps.traffic,
      defer: this.deps.defer,
      cameraSettings: () => this.camera,
    })

    this.scheduler = new EventScheduler({
      clock: this.deps.clock,
      random: this.deps.random,
      generator: new VehicleGenerator(this.catalog, this.plates, this.deps.random),
      onAppear: (vehicle) => this.pipeline.handleAppear(vehicle),
      onEscape: (vehicle) => this.pipeline.handleEscape(vehicle),
    })

    const events = (await repository.loadEvents()) ?? [defaultEventConfig(this.catalog, 'evt-1', 'Perfil realista', null)]
    this.nextEventId = events.reduce((max, event) => Math.max(max, Number(event.id.replace(/\D/g, '')) || 0), 0) + 1
    this.scheduler.setEvents(events)

    this.wireSignals()
  }

  start(): void {
    this.timers.push(setInterval(() => this.scheduler.tick(), TICK_MS))
    this.timers.push(
      setInterval(() => {
        if (this.scheduler.hasActivity()) this.vehiclesChanged.emit(this.scheduler.views())
      }, VEHICLE_BROADCAST_MS),
    )
    if (this.settings.lastPort) {
      this.openPort(this.settings.lastPort).catch(() => undefined)
    }
  }

  async stop(): Promise<void> {
    this.timers.forEach((timer) => clearInterval(timer))
    this.timers = []
    await this.deps.transport.close()
    await this.storage.close()
    await this.deps.repository.saveStamperState(this.stamper.state())
  }

  snapshot(): SimulatorSnapshot {
    return {
      serial: this.deps.transport.currentStatus(),
      settings: this.settings,
      stats: this.controller.currentStats(),
      queue: this.queue.views(),
      events: this.scheduler.events(),
      vehicles: this.scheduler.views(),
      camera: this.cameraView(),
      cameraStatus: this.cameraService.currentStatus(),
      nextSerial: this.stamper.state().nextSerial,
    }
  }

  catalogData(): SimulatorCatalog {
    return {
      behaviors: listBehaviors(),
      presets: listPresets(),
      classes: this.catalog.data(),
      plateFolders: this.plates.folders(),
    }
  }

  trafficHistory(): TrafficEntry[] {
    return this.deps.traffic.recent()
  }

  listPorts(): Promise<SerialPortInfo[]> {
    return this.deps.listPorts()
  }

  async openPort(path: string): Promise<void> {
    if (!path.trim()) throw new ValidationError({ port: 'selecione uma porta COM' })
    try {
      await this.deps.transport.open(path.trim())
      this.deps.traffic.log('info', `Porta ${path} aberta (115200 8N1), aguardando poll 0x98`)
    } catch (error) {
      this.deps.traffic.log('error', `Não foi possível abrir ${path}: ${(error as Error).message}`)
      throw error
    } finally {
      await this.saveSettings({ ...this.settings, lastPort: path.trim() })
    }
  }

  async closePort(): Promise<void> {
    await this.deps.transport.close()
    this.deps.traffic.log('info', 'Porta serial fechada')
    await this.saveSettings({ ...this.settings, lastPort: null })
  }

  async setProfile(profile: ResponseProfile): Promise<void> {
    const normalized = normalizeProfile(profile)
    this.controller.setProfile(normalized)
    await this.saveSettings({ ...this.settings, profile: normalized })
    this.deps.traffic.log('info', `Comportamento de resposta: ${normalized.behaviorId}${normalized.ackMode === 'ignore' ? ', ignorando ACK' : ''}`)
  }

  async updateEquipment(siteId: number, equipmentClockOffsetMs: number): Promise<void> {
    validateSiteAndClock(siteId, equipmentClockOffsetMs)
    this.equipmentClock.setOffset(equipmentClockOffsetMs)
    await this.saveSettings({ ...this.settings, siteId, equipmentClockOffsetMs })
  }

  async setNextSerial(value: number): Promise<void> {
    validateSerialNumber(value)
    this.stamper.setNextSerial(value)
    await this.deps.repository.saveStamperState(this.stamper.state())
    this.deps.traffic.log('info', `Próximo serial do equipamento: ${value}`)
    this.queueSnapshot()
  }

  resetStats(): void {
    this.controller.resetStats()
  }

  async createEvent(): Promise<EventConfig> {
    const id = `evt-${this.nextEventId++}`
    const config = defaultEventConfig(this.catalog, id, `Evento ${this.scheduler.events().length + 1}`)
    this.scheduler.upsert(config)
    await this.persistEvents()
    return config
  }

  async updateEvent(config: EventConfig): Promise<EventConfig> {
    this.requireEvent(config.id)
    const valid = validateEvent(config, new Set(listPresets().map((preset) => preset.id)))
    this.scheduler.upsert(valid)
    await this.persistEvents()
    return valid
  }

  async deleteEvent(id: string): Promise<void> {
    this.requireEvent(id)
    this.scheduler.remove(id)
    await this.persistEvents()
  }

  emitEvent(id: string, immediate: boolean, presetId?: string | null): void {
    this.requireEvent(id)
    this.scheduler.emit(id, { immediate, presetId })
  }

  emitBurst(id: string, count: number, spacingMs: number, presetId?: string | null): number {
    this.requireEvent(id)
    const errors: Record<string, string> = {}
    if (!Number.isInteger(count) || count < 1 || count > MAX_BURST) errors.count = `entre 1 e ${MAX_BURST}`
    if (!Number.isInteger(spacingMs) || spacingMs < 0 || spacingMs > 60000) errors.spacingMs = 'entre 0 e 60000 ms'
    if (Object.keys(errors).length > 0) throw new ValidationError(errors)
    return this.scheduler.emitBurst(id, count, spacingMs, presetId)
  }

  async setAutoEmit(id: string, enabled: boolean): Promise<void> {
    this.requireEvent(id)
    this.scheduler.setAutoEmit(id, enabled)
    await this.persistEvents()
  }

  async importRustEvents(json: unknown): Promise<number> {
    const imported = importRustConfig(json, this.catalog, () => `evt-${this.nextEventId++}`)
    this.scheduler.setEvents([...this.scheduler.events(), ...imported])
    await this.persistEvents()
    return imported.length
  }

  clearQueue(): void {
    this.queue.clear()
    this.deps.traffic.log('info', 'Fila do equipamento limpa')
  }

  removeFromQueue(id: string): boolean {
    return this.queue.remove(id)
  }

  async updateCamera(input: CameraSettingsInput): Promise<void> {
    const merged = validateCamera({ ...input, password: input.password ?? this.camera.password })
    this.camera = merged
    await this.storage.reconfigure(merged)
    await this.deps.repository.saveCamera(merged)
    this.queueSnapshot()
  }

  async testCamera(): Promise<void> {
    await this.cameraService.test()
    this.deps.traffic.log('info', `FTP ${this.camera.user}@${this.camera.host}:${this.camera.port} respondeu`)
  }

  parseReplay(text: string): ReplayFrameView[] {
    this.replayFrames = parseLogFrames(text)
    return this.replayFrames.map((frame) => frame.view)
  }

  enqueueReplay(indexes: number[]): number {
    const selected = indexes.map((index) => this.replayFrames[index]).filter((frame): frame is ParsedLogFrame => Boolean(frame))
    selected.forEach((frame) => this.pipeline.enqueueReplay(frame.payload, frame.view))
    return selected.length
  }

  listScenarios(): Promise<ScenarioSummary[]> {
    return this.deps.repository.listScenarios()
  }

  async saveScenario(name: string): Promise<void> {
    const trimmed = name.trim()
    if (!isValidScenarioName(trimmed)) throw new ValidationError({ name: 'use letras, números, espaço, - ou _ (até 60)' })
    const { timingMode, delayMs, missingPlateChance, noPlateNaming, uploadEscape, clockOffsetMs } = this.camera
    const scenario: Scenario = {
      name: trimmed,
      savedAt: new Date().toISOString(),
      profile: this.settings.profile,
      equipmentClockOffsetMs: this.settings.equipmentClockOffsetMs,
      camera: { timingMode, delayMs, missingPlateChance, noPlateNaming, uploadEscape, clockOffsetMs },
      events: this.scheduler.events().map((event) => ({ ...event, autoEmit: false })),
    }
    await this.deps.repository.saveScenario(scenario)
  }

  async loadScenario(name: string): Promise<void> {
    const scenario = await this.deps.repository.loadScenario(name)
    if (!scenario) throw new ValidationError({ name: 'cenário não encontrado' })
    await this.setProfile(scenario.profile)
    await this.updateEquipment(this.settings.siteId, scenario.equipmentClockOffsetMs)
    this.camera = { ...this.camera, ...scenario.camera }
    await this.deps.repository.saveCamera(this.camera)
    this.scheduler.setEvents(scenario.events)
    await this.persistEvents()
    this.deps.traffic.log('info', `Cenário "${scenario.name}" carregado`)
  }

  deleteScenario(name: string): Promise<void> {
    return this.deps.repository.deleteScenario(name)
  }

  private requireEvent(id: string) {
    if (!this.scheduler.events().some((event) => event.id === id)) throw new ValidationError({ id: 'evento não encontrado' })
  }

  private cameraView(): CameraSettingsView {
    const { password, ...rest } = this.camera
    return { ...rest, hasPassword: password.length > 0 }
  }

  private async saveSettings(settings: SimulatorSettings) {
    this.settings = settings
    await this.deps.repository.saveSettings(settings)
    this.queueSnapshot()
  }

  private persistEvents() {
    return this.deps.repository.saveEvents(this.scheduler.events())
  }

  private wireSignals() {
    this.deps.transport.data.subscribe((bytes) => {
      this.controller.receive(bytes).catch(() => undefined)
    })
    this.deps.transport.statusChanged.subscribe((status) => {
      this.controller.attach(status.open ? this.deps.transport : null)
      if (!status.open && status.error) this.deps.traffic.log('warn', `Porta serial: ${status.error}`)
      this.queueSnapshot()
    })
    this.queue.changed.subscribe(() => {
      this.queueSnapshot()
      this.queueStamperSave()
    })
    this.controller.statsChanged.subscribe(() => this.queueSnapshot())
    this.scheduler.changed.subscribe(() => this.queueSnapshot())
    this.cameraService.statusChanged.subscribe(() => this.queueSnapshot())
  }

  private queueSnapshot() {
    if (this.snapshotTimer) return
    this.snapshotTimer = setTimeout(() => {
      this.snapshotTimer = null
      this.snapshotChanged.emit(this.snapshot())
    }, SNAPSHOT_DEBOUNCE_MS)
  }

  private queueStamperSave() {
    if (this.stamperTimer) return
    this.stamperTimer = setTimeout(() => {
      this.stamperTimer = null
      this.deps.repository.saveStamperState(this.stamper.state()).catch(() => undefined)
    }, STAMPER_SAVE_DEBOUNCE_MS)
  }
}
