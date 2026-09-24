import { FaBolt, FaClock, FaLayerGroup, FaPause, FaPlay } from 'react-icons/fa'
import type { EventConfig } from '../../../../shared/events'
import { Button, Input } from '../../../components/globals'
import { parseInteger } from '../../../utils/format'
import * as h from '../hooks'
import * as S from '../styles'

export function EmitBar({ event }: { event: EventConfig }) {
  const actions = h.useEmitActions(event)

  return (
    <S.EmitBar>
      <Button icon={<FaBolt />} onClick={() => actions.emit(true)} disabled={actions.running}>
        Passar agora
      </Button>
      <Button variant="secondary" icon={<FaClock />} onClick={() => actions.emit(false)} disabled={actions.running}>
        Agendar
      </Button>
      <Button variant={actions.autoEmit ? 'danger' : 'success'} icon={actions.autoEmit ? <FaPause /> : <FaPlay />} onClick={actions.toggleAuto} disabled={actions.running}>
        {actions.autoEmit ? 'Pausar automático' : 'Emitir automático'}
      </Button>
      <S.BurstFields>
        <Input
          type="number"
          label="Rajada"
          suffix="veíc."
          min={1}
          value={Number.isFinite(actions.burstCount) ? actions.burstCount : ''}
          error={actions.countError}
          onChange={(change) => actions.setBurstCount(parseInteger(change.target.value))}
        />
        <Input
          type="number"
          label="Intervalo"
          suffix="ms"
          min={0}
          value={Number.isFinite(actions.burstSpacing) ? actions.burstSpacing : ''}
          error={actions.spacingError}
          onChange={(change) => actions.setBurstSpacing(parseInteger(change.target.value))}
        />
        <Button variant="secondary" icon={<FaLayerGroup />} onClick={actions.burst} disabled={actions.running}>
          Rajada
        </Button>
      </S.BurstFields>
    </S.EmitBar>
  )
}
