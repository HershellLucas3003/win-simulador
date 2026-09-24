import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { EventConfig, RandomChance, RandomRange } from '../../../shared/events'
import type { SelectOption } from '../../components/globals'
import { useSimulator } from '../../contexts/SimulatorContext'
import { useToast } from '../../contexts/ToastContext'
import { useAction } from '../../hooks/useAction'
import { useDraft } from '../../hooks/useDraft'
import { simulatorApi } from '../../services/simulatorApi'
import type { RangeFieldSpec } from './utils'
import { classIndexLabel, classOptions, fromClassValue, fromDisplayRange, toClassValue, toDisplayRange } from './utils'

const NO_PRESET = ''

export function useEventSelection() {
  const { snapshot, vehicles } = useSimulator()
  const events = useMemo(() => snapshot?.events ?? [], [snapshot])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { run, running } = useAction()

  useEffect(() => {
    if (events.length === 0) return setSelectedId(null)
    if (!selectedId || !events.some((event) => event.id === selectedId)) setSelectedId(events[0].id)
  }, [events, selectedId])

  const activeByEvent = useMemo(() => {
    const counts = new Map<string, number>()
    vehicles.forEach((vehicle) => counts.set(vehicle.eventId, (counts.get(vehicle.eventId) ?? 0) + 1))
    return counts
  }, [vehicles])

  const create = async () => {
    const created = await run(() => simulatorApi.createEvent(), { success: 'Evento criado' })
    if (created) setSelectedId(created.id)
  }

  return {
    events,
    selected: events.find((event) => event.id === selectedId) ?? null,
    selectedId,
    select: setSelectedId,
    activeCount: (eventId: string) => activeByEvent.get(eventId) ?? 0,
    create,
    creating: running,
  }
}

export function useEventListItem(event: EventConfig) {
  const { catalog } = useSimulator()
  return { classLabel: classIndexLabel(catalog?.classes, event.classIndex) }
}

export function useEventForm(event: EventConfig) {
  const { catalog } = useSimulator()
  const draft = useDraft<EventConfig>(event, JSON.stringify(event))
  const { run, running, fieldError, clearFieldError } = useAction()

  const options = useMemo(() => classOptions(catalog?.classes), [catalog])
  const presetOptions = useMemo<SelectOption[]>(
    () => [{ value: NO_PRESET, label: 'Veículo normal' }, ...(catalog?.presets ?? []).map((preset) => ({ value: preset.id, label: preset.label }))],
    [catalog],
  )
  const presetDescription = catalog?.presets.find((preset) => preset.id === draft.value.presetId)?.description ?? null

  const setName = (name: string) => {
    clearFieldError('name')
    draft.patch({ name })
  }
  const setClass = (value: string) => draft.patch({ classIndex: fromClassValue(value) })
  const setPreset = (value: string) => {
    clearFieldError('presetId')
    draft.patch({ presetId: value === NO_PRESET ? null : value })
  }
  const rangeValue = (spec: RangeFieldSpec) => toDisplayRange(draft.value[spec.key], spec.scale)
  const setRange = (spec: RangeFieldSpec, value: RandomRange) => {
    clearFieldError(`${spec.key}.min`)
    clearFieldError(`${spec.key}.max`)
    draft.patch({ [spec.key]: fromDisplayRange(value, spec.scale) } as Partial<EventConfig>)
  }
  const setChance = (key: 'differentPlateChance' | 'escapeChance', patch: Partial<RandomChance>) => {
    clearFieldError(`${key}.percent`)
    draft.patch({ [key]: { ...draft.value[key], ...patch } } as Partial<EventConfig>)
  }

  const save = async () => {
    const saved = await run(() => simulatorApi.updateEvent({ ...draft.value, autoEmit: event.autoEmit }), { success: 'Evento salvo' })
    if (saved) draft.markSaved()
  }

  return {
    value: draft.value,
    dirty: draft.dirty,
    saving: running,
    fieldError,
    classValue: toClassValue(draft.value.classIndex),
    classOptions: options,
    presetValue: draft.value.presetId ?? NO_PRESET,
    presetOptions,
    presetDescription,
    setName,
    setClass,
    setPreset,
    rangeValue,
    setRange,
    setChance,
    save,
    discard: draft.reset,
  }
}

export function useEmitActions(event: EventConfig) {
  const { run, running, fieldError, clearFieldError } = useAction()
  const [burstCount, setBurstCountState] = useState(5)
  const [burstSpacing, setBurstSpacingState] = useState(300)

  const emit = (immediate: boolean) =>
    run(() => simulatorApi.emitEvent(event.id, immediate), { success: immediate ? 'Veículo passando agora' : 'Veículo agendado' })

  const burst = () => run(() => simulatorApi.emitBurst(event.id, burstCount, burstSpacing), { success: `Rajada de ${burstCount} veículos agendada` })

  const toggleAuto = () =>
    run(() => simulatorApi.setAutoEmit(event.id, !event.autoEmit), { success: event.autoEmit ? 'Emissão automática pausada' : 'Emissão automática ligada' })

  const setBurstCount = (value: number) => {
    clearFieldError('count')
    setBurstCountState(value)
  }
  const setBurstSpacing = (value: number) => {
    clearFieldError('spacingMs')
    setBurstSpacingState(value)
  }

  return {
    running,
    autoEmit: event.autoEmit,
    emit,
    burst,
    toggleAuto,
    burstCount,
    burstSpacing,
    setBurstCount,
    setBurstSpacing,
    countError: fieldError('count'),
    spacingError: fieldError('spacingMs'),
  }
}

export function useEventDelete() {
  const [pending, setPending] = useState<EventConfig | null>(null)
  const { run, running } = useAction()

  const request = useCallback((event: EventConfig) => setPending(event), [])
  const cancel = useCallback(() => setPending(null), [])
  const confirm = async () => {
    if (!pending) return
    const removed = await run(() => simulatorApi.deleteEvent(pending.id), { success: `Evento "${pending.name}" removido` })
    if (removed) setPending(null)
  }

  return { pending, request, cancel, confirm, deleting: running }
}

export function useRustImport() {
  const toast = useToast()
  const { run, running } = useAction()
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => inputRef.current?.click()

  const importFile = async (changeEvent: ChangeEvent<HTMLInputElement>) => {
    const file = changeEvent.target.files?.[0]
    changeEvent.target.value = ''
    if (!file) return
    let json: unknown
    try {
      json = JSON.parse(await file.text())
    } catch {
      toast.error(`${file.name} não é um JSON válido`)
      return
    }
    const result = await run(() => simulatorApi.importRustEvents(json))
    if (result) toast.success(`${result.imported} evento(s) importado(s) do simulate_wim`)
  }

  return { inputRef, openPicker, importFile, importing: running }
}
