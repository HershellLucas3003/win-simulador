import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import type { TrafficEntry } from '../../../shared/equipment'
import type { ActiveVehicleView } from '../../../shared/events'
import type { ServerMessage, SimulatorCatalog, SimulatorSnapshot } from '../../../shared/snapshot'
import { simulatorApi } from '../../services/simulatorApi'
import { INITIAL_LIVE_STATE, liveReducer } from './liveState'
import { useLiveSocket } from './useLiveSocket'

export interface SimulatorContextValue {
  online: boolean
  snapshot: SimulatorSnapshot | null
  vehicles: ActiveVehicleView[]
  traffic: TrafficEntry[]
  catalog: SimulatorCatalog | null
  replaceSnapshot: (snapshot: SimulatorSnapshot) => void
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null)

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(liveReducer, INITIAL_LIVE_STATE)
  const [catalog, setCatalog] = useState<SimulatorCatalog | null>(null)
  const handleMessage = useCallback((message: ServerMessage) => dispatch(message), [])
  const online = useLiveSocket(handleMessage)

  useEffect(() => {
    if (online && !catalog) simulatorApi.catalog().then(setCatalog).catch(() => undefined)
  }, [online, catalog])

  const replaceSnapshot = useCallback((snapshot: SimulatorSnapshot) => dispatch({ type: 'replace-snapshot', data: snapshot }), [])

  const value = useMemo<SimulatorContextValue>(
    () => ({ online, snapshot: state.snapshot, vehicles: state.vehicles, traffic: state.traffic, catalog, replaceSnapshot }),
    [online, state, catalog, replaceSnapshot],
  )

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>
}

export function useSimulator(): SimulatorContextValue {
  const value = useContext(SimulatorContext)
  if (!value) throw new Error('useSimulator precisa estar dentro de SimulatorProvider')
  return value
}
