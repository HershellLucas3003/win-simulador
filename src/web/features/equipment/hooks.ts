import { useMemo } from 'react'
import type { AckMode, BehaviorDescriptor, ResponseProfile } from '../../../shared/scenario'
import { DEFAULT_RESPONSE_PROFILE } from '../../../shared/scenario'
import type { SelectOption } from '../../components/globals'
import { useSimulator } from '../../contexts/SimulatorContext'
import { useAction } from '../../hooks/useAction'
import { useDraft } from '../../hooks/useDraft'
import { simulatorApi } from '../../services/simulatorApi'

export const REAL_CLOCK_OFFSET_SECONDS = -206
export const SERIAL_NEAR_WRAP = 0xfffffff0

export const ACK_OPTIONS: SelectOption[] = [
  { value: 'honor', label: 'Remover o frame ao receber ACK (real)' },
  { value: 'ignore', label: 'Ignorar ACK e reenviar o mesmo frame' },
]

function paramsFor(descriptor: BehaviorDescriptor | undefined, current: Record<string, number>) {
  return Object.fromEntries((descriptor?.params ?? []).map((param) => [param.key, current[param.key] ?? param.defaultValue]))
}

export function useResponseProfile() {
  const { snapshot, catalog } = useSimulator()
  const source = snapshot?.settings.profile ?? DEFAULT_RESPONSE_PROFILE
  const draft = useDraft<ResponseProfile>(source, JSON.stringify(source))
  const { run, running } = useAction()
  const behaviors = catalog?.behaviors ?? []
  const descriptor = behaviors.find((behavior) => behavior.id === draft.value.behaviorId)

  const behaviorOptions = useMemo<SelectOption[]>(() => behaviors.map((behavior) => ({ value: behavior.id, label: behavior.label })), [behaviors])

  const selectBehavior = (behaviorId: string) => {
    const next = behaviors.find((behavior) => behavior.id === behaviorId)
    draft.patch({ behaviorId, params: paramsFor(next, {}) })
  }

  const setParam = (key: string, value: number) => draft.patch({ params: { ...draft.value.params, [key]: value } })
  const setAckMode = (ackMode: string) => draft.patch({ ackMode: ackMode as AckMode })
  const setDelay = (responseDelayMs: number) => draft.patch({ responseDelayMs })
  const setJitter = (jitterMs: number) => draft.patch({ jitterMs })

  const apply = async () => {
    const saved = await run(() => simulatorApi.setProfile({ ...draft.value, params: paramsFor(descriptor, draft.value.params) }), {
      success: 'Comportamento aplicado',
    })
    if (saved) draft.markSaved()
  }

  return {
    profile: draft.value,
    params: paramsFor(descriptor, draft.value.params),
    descriptor,
    behaviorOptions,
    dirty: draft.dirty,
    running,
    selectBehavior,
    setParam,
    setAckMode,
    setDelay,
    setJitter,
    apply,
    discard: draft.reset,
  }
}

interface EquipmentForm {
  siteId: number
  clockOffsetSeconds: number
}

export function useEquipmentSettings() {
  const { snapshot } = useSimulator()
  const source: EquipmentForm = {
    siteId: snapshot?.settings.siteId ?? 1,
    clockOffsetSeconds: Math.round((snapshot?.settings.equipmentClockOffsetMs ?? 0) / 1000),
  }
  const draft = useDraft(source, `${source.siteId}:${source.clockOffsetSeconds}`)
  const { run, running, fieldError, clearFieldError } = useAction()

  const setSiteId = (siteId: number) => {
    clearFieldError('siteId')
    draft.patch({ siteId })
  }
  const setClockOffset = (clockOffsetSeconds: number) => {
    clearFieldError('equipmentClockOffsetMs')
    draft.patch({ clockOffsetSeconds })
  }
  const applyRealOffset = () => setClockOffset(REAL_CLOCK_OFFSET_SECONDS)

  const save = async () => {
    const saved = await run(() => simulatorApi.updateEquipment(draft.value.siteId, Math.round(draft.value.clockOffsetSeconds * 1000)), {
      success: 'Equipamento atualizado',
    })
    if (saved) draft.markSaved()
  }

  return {
    form: draft.value,
    dirty: draft.dirty,
    running,
    siteError: fieldError('siteId'),
    offsetError: fieldError('equipmentClockOffsetMs'),
    setSiteId,
    setClockOffset,
    applyRealOffset,
    save,
  }
}

export function useSerialNumber() {
  const { snapshot } = useSimulator()
  const source = snapshot?.nextSerial ?? 0
  const draft = useDraft<number>(source, String(source))
  const { run, running, fieldError, clearFieldError } = useAction()

  const setValue = (value: number) => {
    clearFieldError('nextSerial')
    draft.set(value)
  }

  const save = async (value = draft.value) => {
    const saved = await run(() => simulatorApi.setNextSerial(value), { success: `Próximo serial: ${value}` })
    if (saved) draft.markSaved()
  }

  return {
    value: draft.value,
    current: source,
    dirty: draft.dirty,
    running,
    error: fieldError('nextSerial'),
    setValue,
    save: () => save(),
    nearWrap: () => {
      draft.set(SERIAL_NEAR_WRAP)
      return save(SERIAL_NEAR_WRAP)
    },
  }
}

export function useStatsReset() {
  const { run, running } = useAction()
  return { reset: () => run(() => simulatorApi.resetStats(), { success: 'Contadores zerados' }), running }
}
