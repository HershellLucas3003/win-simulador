import { FaClock, FaHashtag, FaMicrochip, FaRedo, FaSave } from 'react-icons/fa'
import { Button, Input, Panel } from '../../../components/globals'
import { formatNumber, formatOffset, parseInteger } from '../../../utils/format'
import * as h from '../hooks'
import * as S from '../styles'

export function EquipmentIdentityCard() {
  const equipment = h.useEquipmentSettings()
  const serial = h.useSerialNumber()
  const stats = h.useStatsReset()

  return (
    <Panel title="Equipamento" icon={<FaMicrochip />} scroll={false}>
      <S.Stack>
        <S.Grid>
          <Input
            type="number"
            label="Site"
            min={0}
            max={99}
            value={Number.isFinite(equipment.form.siteId) ? equipment.form.siteId : ''}
            error={equipment.siteError}
            onChange={(event) => equipment.setSiteId(parseInteger(event.target.value))}
          />
          <Input
            type="number"
            label="Desvio do relógio"
            suffix="s"
            value={Number.isFinite(equipment.form.clockOffsetSeconds) ? equipment.form.clockOffsetSeconds : ''}
            error={equipment.offsetError}
            onChange={(event) => equipment.setClockOffset(parseInteger(event.target.value))}
          />
        </S.Grid>
        <S.Hint>
          O site define as pastas WIM_XX da câmera. O desvio vai no dateStart do frame: {formatOffset(equipment.form.clockOffsetSeconds * 1000)}.
        </S.Hint>
        <S.Actions>
          <Button variant="secondary" icon={<FaClock />} onClick={equipment.applyRealOffset}>
            Desvio do log real (-3 min 26 s)
          </Button>
          <Button icon={<FaSave />} onClick={equipment.save} loading={equipment.running} disabled={!equipment.dirty}>
            Salvar
          </Button>
        </S.Actions>

        <Input
          type="number"
          label={`Próximo serial (atual ${formatNumber(serial.current)})`}
          min={0}
          value={Number.isFinite(serial.value) ? serial.value : ''}
          error={serial.error}
          onChange={(event) => serial.setValue(parseInteger(event.target.value))}
        />
        <S.Actions>
          <Button variant="secondary" icon={<FaHashtag />} onClick={serial.nearWrap} disabled={serial.running}>
            Perto do limite u32
          </Button>
          <Button icon={<FaSave />} onClick={serial.save} loading={serial.running} disabled={!serial.dirty}>
            Definir serial
          </Button>
        </S.Actions>

        <S.Actions>
          <Button variant="ghost" icon={<FaRedo />} onClick={stats.reset} loading={stats.running}>
            Zerar contadores
          </Button>
        </S.Actions>
      </S.Stack>
    </Panel>
  )
}
