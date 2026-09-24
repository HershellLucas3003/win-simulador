import type { CameraSettings } from '../../shared/camera'
import { DEFAULT_CAMERA_SETTINGS } from '../../shared/camera'
import type { ClassCatalogData } from '../../shared/classes'
import type { EventConfig } from '../../shared/events'
import { DEFAULT_RESPONSE_PROFILE } from '../../shared/scenario'
import type { Scenario, ScenarioSummary, SimulatorSettings } from '../../shared/settings'
import type { StamperState } from '../equipment/FrameStamper'
import { INITIAL_STAMPER_STATE } from '../equipment/FrameStamper'
import type { JsonFileStore } from './JsonFileStore'

const FILES = {
  settings: 'settings.json',
  events: 'events.json',
  camera: 'camera.json',
  classes: 'classes.json',
  stamper: 'equipment-state.json',
  scenarios: 'scenarios',
}

export const DEFAULT_SETTINGS: SimulatorSettings = {
  siteId: 1,
  lastPort: null,
  equipmentClockOffsetMs: 0,
  profile: DEFAULT_RESPONSE_PROFILE,
}

const SCENARIO_NAME = /^[\w\- ]{1,60}$/

export function isValidScenarioName(name: string): boolean {
  return SCENARIO_NAME.test(name)
}

export class SimulatorRepository {
  constructor(private readonly store: JsonFileStore) {}

  async loadSettings(): Promise<SimulatorSettings> {
    const saved = await this.store.read<Partial<SimulatorSettings>>(FILES.settings, {})
    return { ...DEFAULT_SETTINGS, ...saved, profile: { ...DEFAULT_RESPONSE_PROFILE, ...saved.profile } }
  }

  saveSettings(settings: SimulatorSettings): Promise<void> {
    return this.store.write(FILES.settings, settings)
  }

  loadEvents(): Promise<EventConfig[] | null> {
    return this.store.read<EventConfig[] | null>(FILES.events, null)
  }

  saveEvents(events: EventConfig[]): Promise<void> {
    return this.store.write(FILES.events, events)
  }

  async loadCamera(): Promise<CameraSettings> {
    return { ...DEFAULT_CAMERA_SETTINGS, ...(await this.store.read<Partial<CameraSettings>>(FILES.camera, {})) }
  }

  saveCamera(camera: CameraSettings): Promise<void> {
    return this.store.write(FILES.camera, camera)
  }

  loadClasses(): Promise<ClassCatalogData> {
    return this.store.read<ClassCatalogData>(FILES.classes, { classes: [], indexes: [], imageFolderByAxles: {} })
  }

  async loadStamperState(): Promise<StamperState> {
    return { ...INITIAL_STAMPER_STATE, ...(await this.store.read<Partial<StamperState>>(FILES.stamper, {})) }
  }

  saveStamperState(state: StamperState): Promise<void> {
    return this.store.write(FILES.stamper, state)
  }

  async listScenarios(): Promise<ScenarioSummary[]> {
    const files = await this.store.list(FILES.scenarios)
    const scenarios = await Promise.all(files.map((file) => this.store.read<Scenario | null>(`${FILES.scenarios}/${file}`, null)))
    return scenarios
      .filter((scenario): scenario is Scenario => scenario !== null)
      .map((scenario) => ({
        name: scenario.name,
        savedAt: scenario.savedAt,
        events: scenario.events.length,
        behaviorId: scenario.profile.behaviorId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async loadScenario(name: string): Promise<Scenario | null> {
    return this.store.read<Scenario | null>(this.scenarioPath(name), null)
  }

  async saveScenario(scenario: Scenario): Promise<void> {
    return this.store.write(this.scenarioPath(scenario.name), scenario)
  }

  async deleteScenario(name: string): Promise<void> {
    return this.store.remove(this.scenarioPath(name))
  }

  private scenarioPath(name: string) {
    if (!isValidScenarioName(name)) throw new Error('nome de cenário inválido')
    return `${FILES.scenarios}/${name}.json`
  }
}
