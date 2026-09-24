import type { SerialPortInfo, SerialStatus, TrafficEntry } from '../../shared/equipment'
import type { EventConfig } from '../../shared/events'
import type { ReplayFrameView } from '../../shared/replay'
import type { ResponseProfile } from '../../shared/scenario'
import type { ScenarioSummary, SimulatorSettings } from '../../shared/settings'
import type { CameraSettingsInput, CameraSettingsView, SimulatorCatalog, SimulatorSnapshot } from '../../shared/snapshot'
import { request } from './http'

const encode = encodeURIComponent

export const simulatorApi = {
  snapshot: () => request<SimulatorSnapshot>('GET', '/api/snapshot'),
  catalog: () => request<SimulatorCatalog>('GET', '/api/catalog'),
  traffic: () => request<TrafficEntry[]>('GET', '/api/traffic'),

  listPorts: () => request<SerialPortInfo[]>('GET', '/api/serial/ports'),
  openPort: (path: string) => request<SerialStatus>('POST', '/api/serial/open', { path }),
  closePort: () => request<SerialStatus>('POST', '/api/serial/close'),

  setProfile: (profile: ResponseProfile) => request<ResponseProfile>('PUT', '/api/profile', profile),
  updateEquipment: (siteId: number, equipmentClockOffsetMs: number) =>
    request<SimulatorSettings>('PUT', '/api/equipment', { siteId, equipmentClockOffsetMs }),
  setNextSerial: (nextSerial: number) => request<{ nextSerial: number }>('PUT', '/api/equipment/serial', { nextSerial }),
  resetStats: () => request<{ ok: boolean }>('POST', '/api/equipment/stats/reset'),

  createEvent: () => request<EventConfig>('POST', '/api/events'),
  updateEvent: (config: EventConfig) => request<EventConfig>('PUT', `/api/events/${encode(config.id)}`, config),
  deleteEvent: (id: string) => request<{ ok: boolean }>('DELETE', `/api/events/${encode(id)}`),
  emitEvent: (id: string, immediate: boolean, presetId?: string | null) =>
    request<{ ok: boolean }>('POST', `/api/events/${encode(id)}/emit`, { immediate, presetId }),
  emitBurst: (id: string, count: number, spacingMs: number, presetId?: string | null) =>
    request<{ emitted: number }>('POST', `/api/events/${encode(id)}/burst`, { count, spacingMs, presetId }),
  setAutoEmit: (id: string, enabled: boolean) => request<{ ok: boolean }>('POST', `/api/events/${encode(id)}/auto`, { enabled }),
  importRustEvents: (json: unknown) => request<{ imported: number }>('POST', '/api/events/import-rust', json),

  clearQueue: () => request<{ ok: boolean }>('DELETE', '/api/queue'),
  removeFromQueue: (id: string) => request<{ removed: boolean }>('DELETE', `/api/queue/${encode(id)}`),

  updateCamera: (camera: CameraSettingsInput) => request<CameraSettingsView>('PUT', '/api/camera', camera),
  testCamera: () => request<{ ok: boolean }>('POST', '/api/camera/test'),

  parseReplay: (text: string) => request<ReplayFrameView[]>('POST', '/api/replay/parse', { text }),
  enqueueReplay: (indexes: number[]) => request<{ enqueued: number }>('POST', '/api/replay/enqueue', { indexes }),

  listScenarios: () => request<ScenarioSummary[]>('GET', '/api/scenarios'),
  saveScenario: (name: string) => request<ScenarioSummary[]>('POST', '/api/scenarios', { name }),
  loadScenario: (name: string) => request<SimulatorSnapshot>('POST', `/api/scenarios/${encode(name)}/load`),
  deleteScenario: (name: string) => request<ScenarioSummary[]>('DELETE', `/api/scenarios/${encode(name)}`),
}
