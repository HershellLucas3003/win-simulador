import type { ReactNode } from 'react'
import { FaCamera, FaFolderOpen, FaHistory, FaListUl, FaMicrochip } from 'react-icons/fa'
import type { TabItem } from './components/globals'
import { Tabs } from './components/globals'
import { CameraPanel } from './features/camera'
import { ConnectionBar } from './features/connection'
import { EquipmentPanel } from './features/equipment'
import { EventsWorkspace } from './features/events'
import { QueueColumn } from './features/queue'
import { ReplayPanel } from './features/replay'
import { ScenarioPanel } from './features/scenarios'
import { TrafficLog } from './features/traffic'
import type { WorkspaceTab } from './hooks/useWorkspaceTabs'
import { useWorkspaceTabs } from './hooks/useWorkspaceTabs'
import * as S from './styles'

const TAB_ITEMS: TabItem[] = [
  { id: 'events', label: 'Eventos', icon: <FaListUl /> },
  { id: 'equipment', label: 'Equipamento', icon: <FaMicrochip /> },
  { id: 'camera', label: 'Câmera', icon: <FaCamera /> },
  { id: 'replay', label: 'Replay', icon: <FaHistory /> },
  { id: 'scenarios', label: 'Cenários', icon: <FaFolderOpen /> },
]

const TAB_CONTENT: Record<WorkspaceTab, ReactNode> = {
  events: <EventsWorkspace />,
  equipment: <EquipmentPanel />,
  camera: <CameraPanel />,
  replay: <ReplayPanel />,
  scenarios: <ScenarioPanel />,
}

export function App() {
  const tabs = useWorkspaceTabs()

  return (
    <S.Shell>
      <ConnectionBar />
      <S.Body>
        <S.Workspace>
          <Tabs items={TAB_ITEMS} active={tabs.active} onChange={tabs.select} />
          <S.TabContent>{TAB_CONTENT[tabs.active]}</S.TabContent>
        </S.Workspace>
        <QueueColumn />
      </S.Body>
      <S.Bottom>
        <TrafficLog />
      </S.Bottom>
    </S.Shell>
  )
}
