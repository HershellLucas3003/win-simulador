import type { TrafficEntry } from '../../../shared/equipment'
import type { ActiveVehicleView } from '../../../shared/events'
import type { ServerMessage, SimulatorSnapshot } from '../../../shared/snapshot'

export const TRAFFIC_LIMIT = 2000

export interface LiveState {
  snapshot: SimulatorSnapshot | null
  vehicles: ActiveVehicleView[]
  traffic: TrafficEntry[]
}

export const INITIAL_LIVE_STATE: LiveState = { snapshot: null, vehicles: [], traffic: [] }

const keepLast = (entries: TrafficEntry[]) => (entries.length > TRAFFIC_LIMIT ? entries.slice(entries.length - TRAFFIC_LIMIT) : entries)

export function liveReducer(state: LiveState, message: ServerMessage | { type: 'replace-snapshot'; data: SimulatorSnapshot }): LiveState {
  switch (message.type) {
    case 'snapshot':
    case 'replace-snapshot':
      return { ...state, snapshot: message.data, vehicles: message.data.vehicles }
    case 'vehicles':
      return { ...state, vehicles: message.data }
    case 'traffic':
      return { ...state, traffic: keepLast([...state.traffic, ...message.data]) }
    case 'traffic-history':
      return { ...state, traffic: keepLast(message.data) }
    default:
      return state
  }
}
