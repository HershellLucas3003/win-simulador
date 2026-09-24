import { FaSave, FaTrash, FaUndo } from 'react-icons/fa'
import type { EventConfig } from '../../../../shared/events'
import { Button, Checkbox, Input, RangeField, Select } from '../../../components/globals'
import { parseInteger } from '../../../utils/format'
import * as h from '../hooks'
import * as S from '../styles'
import type { RangeFieldSpec } from '../utils'
import { TIMING_FIELDS, VEHICLE_FIELDS } from '../utils'
import { EmitBar } from './EmitBar'

interface EventFormProps {
  event: EventConfig
  onDelete: (event: EventConfig) => void
}

export function EventForm({ event, onDelete }: EventFormProps) {
  const form = h.useEventForm(event)

  const renderRange = (spec: RangeFieldSpec) => (
    <RangeField
      key={spec.key}
      label={spec.label}
      unit={spec.unit}
      value={form.rangeValue(spec)}
      minError={form.fieldError(`${spec.key}.min`)}
      maxError={form.fieldError(`${spec.key}.max`)}
      onChange={(value) => form.setRange(spec, value)}
    />
  )

  return (
    <S.Form>
      <EmitBar event={event} />
      {form.dirty && <S.Description>Há alterações não salvas. As emissões usam a configuração salva.</S.Description>}

      <S.Section>
        <S.SectionTitle>Identificação</S.SectionTitle>
        <S.Grid>
          <Input label="Nome" value={form.value.name} error={form.fieldError('name')} onChange={(change) => form.setName(change.target.value)} />
          <Select label="Classe (classIndex do frame)" options={form.classOptions} value={form.classValue} error={form.fieldError('classIndex')} onChange={form.setClass} />
        </S.Grid>
        <Select label="Cenário do veículo" options={form.presetOptions} value={form.presetValue} error={form.fieldError('presetId')} onChange={form.setPreset} />
        {form.presetDescription && <S.Description>{form.presetDescription}</S.Description>}
      </S.Section>

      <S.Section>
        <S.SectionTitle>Veículo</S.SectionTitle>
        <S.Grid>{VEHICLE_FIELDS.map(renderRange)}</S.Grid>
      </S.Section>

      <S.Section>
        <S.SectionTitle>Tempos</S.SectionTitle>
        <S.Grid $columns={3}>{TIMING_FIELDS.map(renderRange)}</S.Grid>
      </S.Section>

      <S.Section>
        <S.SectionTitle>Placa e fuga</S.SectionTitle>
        <S.ChanceRow>
          <Input
            type="number"
            label="Chance de placa lida diferente na fuga"
            suffix="%"
            min={0}
            max={100}
            disabled={form.value.differentPlateChance.always}
            value={Number.isFinite(form.value.differentPlateChance.percent) ? form.value.differentPlateChance.percent : ''}
            error={form.fieldError('differentPlateChance.percent')}
            onChange={(change) => form.setChance('differentPlateChance', { percent: parseInteger(change.target.value) })}
          />
          <Checkbox label="Sempre" checked={form.value.differentPlateChance.always} onChange={(always) => form.setChance('differentPlateChance', { always })} />
          <Checkbox
            label="Será diferente"
            disabled={!form.value.differentPlateChance.always}
            checked={form.value.differentPlateChance.alwaysValue}
            onChange={(alwaysValue) => form.setChance('differentPlateChance', { alwaysValue })}
          />
        </S.ChanceRow>
        <S.ChanceRow>
          <Input
            type="number"
            label="Chance de fuga com excesso de peso"
            suffix="%"
            min={0}
            max={100}
            disabled={form.value.escapeChance.always}
            value={Number.isFinite(form.value.escapeChance.percent) ? form.value.escapeChance.percent : ''}
            error={form.fieldError('escapeChance.percent')}
            onChange={(change) => form.setChance('escapeChance', { percent: parseInteger(change.target.value) })}
          />
          <Checkbox label="Sempre" checked={form.value.escapeChance.always} onChange={(always) => form.setChance('escapeChance', { always })} />
          <Checkbox
            label="Vai fugir"
            disabled={!form.value.escapeChance.always}
            checked={form.value.escapeChance.alwaysValue}
            onChange={(alwaysValue) => form.setChance('escapeChance', { alwaysValue })}
          />
        </S.ChanceRow>
        <S.Description>Veículo sem excesso de peso sempre passa pela câmera de fuga, igual ao simulate_wim.</S.Description>
      </S.Section>

      <S.FormActions>
        <Button variant="danger" icon={<FaTrash />} onClick={() => onDelete(event)}>
          Remover
        </Button>
        <Button variant="secondary" icon={<FaUndo />} onClick={form.discard} disabled={!form.dirty || form.saving}>
          Descartar
        </Button>
        <Button icon={<FaSave />} onClick={form.save} loading={form.saving} disabled={!form.dirty}>
          Salvar evento
        </Button>
      </S.FormActions>
    </S.Form>
  )
}
