import { FaFileImport, FaListUl, FaPlay, FaPlus } from 'react-icons/fa'
import type { EventConfig } from '../../../../shared/events'
import { Badge, Button, EmptyState, Panel } from '../../../components/globals'
import * as h from '../hooks'
import * as S from '../styles'

interface EventListItemProps {
  event: EventConfig
  selected: boolean
  active: number
  onSelect: (id: string) => void
}

function EventListItem({ event, selected, active, onSelect }: EventListItemProps) {
  const item = h.useEventListItem(event)
  return (
    <S.Item $selected={selected} onClick={() => onSelect(event.id)}>
      <S.ItemTitle>{event.name}</S.ItemTitle>
      <S.ItemMeta>
        {item.classLabel}
        {event.autoEmit && (
          <Badge tone="success" icon={<FaPlay />}>
            auto
          </Badge>
        )}
        {event.presetId && <Badge tone="warning">{event.presetId}</Badge>}
        {active > 0 && <Badge tone="info">{active} em trânsito</Badge>}
      </S.ItemMeta>
    </S.Item>
  )
}

interface EventListProps {
  selection: ReturnType<typeof h.useEventSelection>
}

export function EventList({ selection }: EventListProps) {
  const rustImport = h.useRustImport()

  return (
    <Panel
      title="Eventos"
      icon={<FaListUl />}
      padded={false}
      actions={
        <>
          <S.HiddenFile ref={rustImport.inputRef} type="file" accept=".json,application/json" onChange={rustImport.importFile} />
          <Button
            variant="ghost"
            size="sm"
            icon={<FaFileImport />}
            loading={rustImport.importing}
            onClick={rustImport.openPicker}
            title="Importar config.json do simulate_wim"
            aria-label="Importar config.json do simulate_wim"
          />
          <Button size="sm" icon={<FaPlus />} onClick={selection.create} loading={selection.creating}>
            Novo
          </Button>
        </>
      }
    >
      {selection.events.length === 0 ? (
        <EmptyState icon={<FaListUl />}>Nenhum evento. Crie um ou importe o config.json do simulate_wim.</EmptyState>
      ) : (
        <S.List>
          {selection.events.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              selected={event.id === selection.selectedId}
              active={selection.activeCount(event.id)}
              onSelect={selection.select}
            />
          ))}
        </S.List>
      )}
    </Panel>
  )
}
