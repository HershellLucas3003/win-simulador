import { FaSlidersH } from 'react-icons/fa'
import { EmptyState, Modal, Panel } from '../../../components/globals'
import * as h from '../hooks'
import * as S from '../styles'
import { EventForm } from './EventForm'
import { EventList } from './EventList'

export function EventsWorkspace() {
  const selection = h.useEventSelection()
  const removal = h.useEventDelete()

  return (
    <S.Workspace>
      <EventList selection={selection} />
      <Panel title={selection.selected ? selection.selected.name : 'Evento'} icon={<FaSlidersH />}>
        {selection.selected ? (
          <EventForm key={selection.selected.id} event={selection.selected} onDelete={removal.request} />
        ) : (
          <EmptyState icon={<FaSlidersH />}>Selecione ou crie um evento na lista.</EmptyState>
        )}
      </Panel>
      {removal.pending && (
        <Modal title="Remover evento" onSummit={removal.confirm} onCancel={removal.cancel} onSummitName="Remover" submitting={removal.deleting} danger>
          Remover o evento <strong>{removal.pending.name}</strong>? Os veículos dele que ainda não apareceram serão descartados.
        </Modal>
      )}
    </S.Workspace>
  )
}
