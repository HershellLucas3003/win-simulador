import { useState } from 'react'

export type WorkspaceTab = 'events' | 'equipment' | 'camera' | 'replay' | 'scenarios'

const STORAGE_KEY = 'wim-simulator-tab'
const TABS: WorkspaceTab[] = ['events', 'equipment', 'camera', 'replay', 'scenarios']

const readStored = (): WorkspaceTab => {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return TABS.includes(stored as WorkspaceTab) ? (stored as WorkspaceTab) : 'events'
}

export function useWorkspaceTabs() {
  const [active, setActive] = useState<WorkspaceTab>(readStored)

  const select = (tab: string) => {
    if (!TABS.includes(tab as WorkspaceTab)) return
    window.localStorage.setItem(STORAGE_KEY, tab)
    setActive(tab as WorkspaceTab)
  }

  return { active, select }
}
