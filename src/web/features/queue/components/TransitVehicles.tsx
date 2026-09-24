import { FaExclamationTriangle, FaRoad } from 'react-icons/fa'
import { Badge, EmptyState, Panel, ProgressBar } from '../../../components/globals'
import * as h from '../hooks'
import * as S from '../styles'

export function TransitVehicles() {
  const transit = h.useTransitVehicles()

  return (
    <Panel title={`Veículos em trânsito (${transit.items.length})`} icon={<FaRoad />} padded={false}>
      {transit.items.length === 0 ? (
        <EmptyState icon={<FaRoad />}>Nenhum veículo na pista. Emita um evento.</EmptyState>
      ) : (
        <S.List>
          {transit.items.map((item) => (
            <S.Card key={item.id} $highlight={item.overweight}>
              <S.CardHeader>
                <S.CardTitle>{item.plate}</S.CardTitle>
                <S.Badges>
                  {item.overweight && (
                    <Badge tone="error" icon={<FaExclamationTriangle />}>
                      excesso
                    </Badge>
                  )}
                  {item.preset && <Badge tone="warning">{item.preset}</Badge>}
                </S.Badges>
              </S.CardHeader>
              <S.Muted>{item.classLabel}</S.Muted>
              <S.Muted>{item.details}</S.Muted>
              <S.Muted title={item.axles}>{item.axles}</S.Muted>
              <S.ProgressLabel>{item.appear.label}</S.ProgressLabel>
              <ProgressBar value={item.appear.progress} tone="info" label={item.appear.label} />
              {item.escape.visible && (
                <>
                  <S.ProgressLabel>
                    {item.escape.label}
                    {item.escapePlate ? ` · placa lida ${item.escapePlate}` : ''}
                  </S.ProgressLabel>
                  <ProgressBar value={item.escape.progress} tone={item.overweight ? 'error' : 'success'} label={item.escape.label} />
                </>
              )}
            </S.Card>
          ))}
        </S.List>
      )}
    </Panel>
  )
}
