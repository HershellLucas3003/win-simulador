import { FaBroom, FaInbox, FaTimes } from 'react-icons/fa'
import { Badge, Button, EmptyState, Modal, Panel } from '../../../components/globals'
import * as h from '../hooks'
import * as S from '../styles'

export function EquipmentQueue() {
  const queue = h.useEquipmentQueue()

  return (
    <Panel
      title={`Fila do equipamento (${queue.items.length})`}
      icon={<FaInbox />}
      padded={false}
      actions={
        <Button variant="ghost" size="sm" icon={<FaBroom />} onClick={queue.requestClear} disabled={queue.items.length === 0}>
          Limpar
        </Button>
      }
    >
      {queue.items.length === 0 ? (
        <EmptyState icon={<FaInbox />}>Nenhum frame aguardando. O próximo poll recebe FF 15.</EmptyState>
      ) : (
        <S.List>
          {queue.items.map((item) => (
            <S.Card key={item.id}>
              <S.CardHeader>
                <S.CardTitle>{item.title}</S.CardTitle>
                <Button variant="ghost" size="sm" icon={<FaTimes />} onClick={() => queue.remove(item.id)} aria-label="Remover da fila" />
              </S.CardHeader>
              <S.Muted>{item.subtitle}</S.Muted>
              <S.Badges>
                <Badge tone={item.status.tone}>{item.status.label}</Badge>
                <Badge>{item.source}</Badge>
                {item.preset && <Badge tone="warning">{item.preset}</Badge>}
              </S.Badges>
            </S.Card>
          ))}
        </S.List>
      )}
      {queue.confirmingClear && (
        <Modal title="Limpar fila" onSummit={queue.confirmClear} onCancel={queue.cancelClear} onSummitName="Limpar" submitting={queue.running} danger>
          Descartar os {queue.items.length} frame(s) que o equipamento ainda não entregou?
        </Modal>
      )}
    </Panel>
  )
}
