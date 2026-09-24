import { FaPlug, FaPowerOff, FaSyncAlt, FaTruckMoving } from 'react-icons/fa'
import { Badge, Button, Select } from '../../../../components/globals'
import { formatNumber } from '../../../../utils/format'
import * as h from '../../hooks'
import * as S from './styles'

export function ConnectionBar() {
  const ports = h.useSerialPorts()
  const connection = h.useSerialConnection(ports.selected)
  const summary = h.useConnectionSummary()
  const counters = h.useEquipmentCounters()
  const busy = connection.isOpen || connection.isRetrying

  return (
    <S.Bar>
      <S.Brand>
        <FaTruckMoving />
        Simulador do equipamento WIM
      </S.Brand>

      <S.PortControls>
        <Select
          aria-label="Porta COM"
          options={ports.options}
          value={ports.selected}
          placeholder="Selecione a porta COM"
          error={connection.portError}
          disabled={busy}
          onChange={ports.setSelected}
        />
        <Button variant="secondary" icon={<FaSyncAlt />} onClick={ports.refresh} loading={ports.refreshing} disabled={busy} aria-label="Atualizar portas" />
        <Button
          variant={busy ? 'danger' : 'success'}
          icon={busy ? <FaPowerOff /> : <FaPlug />}
          onClick={connection.toggle}
          loading={connection.running}
        >
          {busy ? 'Fechar porta' : 'Abrir porta'}
        </Button>
      </S.PortControls>

      <S.Statuses>
        <Badge tone={summary.backend.tone}>{summary.backend.label}</Badge>
        <Badge tone={summary.serial.tone} title={summary.serial.detail ?? undefined}>
          {summary.serial.label}
        </Badge>
        {summary.serial.detail && <S.Detail>{summary.serial.detail}</S.Detail>}
      </S.Statuses>

      <S.Counters>
        {counters.map((counter) => (
          <S.Counter key={counter.key}>
            <dt>{counter.label}</dt>
            <dd>{formatNumber(counter.value)}</dd>
          </S.Counter>
        ))}
      </S.Counters>
    </S.Bar>
  )
}
