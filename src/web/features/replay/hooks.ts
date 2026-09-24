import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import type { ReplayFrameView } from '../../../shared/replay'
import { useToast } from '../../contexts/ToastContext'
import { useAction } from '../../hooks/useAction'
import { simulatorApi } from '../../services/simulatorApi'
import { formatKg, formatSpeed } from '../../utils/format'

export interface ReplayRow {
  index: number
  selected: boolean
  title: string
  details: string
  origin: string
  hex: string
}

const toRow = (frame: ReplayFrameView, selected: boolean): ReplayRow => ({
  index: frame.index,
  selected,
  title: `Serial ${frame.serial} · classe ${frame.classIndex}${frame.classCode ? ` (${frame.classCode})` : ''}`,
  details: `${frame.numAxles} eixos · ${formatKg(frame.gross)} · ${formatSpeed(frame.speedKmh)} · dateStart ${frame.dateStart}`,
  origin: `linha ${frame.line}${frame.loggedAt ? ` · ${frame.loggedAt}` : ''} · ${frame.receivedBytes} bytes recebidos`,
  hex: frame.hex,
})

export function useReplay() {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [frames, setFrames] = useState<ReplayFrameView[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const parsing = useAction()
  const enqueuing = useAction()

  const openPicker = () => inputRef.current?.click()

  const loadFile = async (change: ChangeEvent<HTMLInputElement>) => {
    const file = change.target.files?.[0]
    change.target.value = ''
    if (!file) return
    const parsed = await parsing.run(async () => simulatorApi.parseReplay(await file.text()))
    if (!parsed) return
    setFileName(file.name)
    setFrames(parsed)
    setSelected(new Set(parsed.map((frame) => frame.index)))
    if (parsed.length === 0) toast.info(`${file.name} não tem frames FF 06 no formato do Main.java`)
  }

  const toggle = (index: number) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })

  const allSelected = frames.length > 0 && selected.size === frames.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(frames.map((frame) => frame.index)))

  const enqueue = () => {
    const indexes = [...selected].sort((a, b) => a - b)
    return enqueuing.run(() => simulatorApi.enqueueReplay(indexes), { success: `${indexes.length} frame(s) do log na fila do equipamento` })
  }

  return {
    inputRef,
    openPicker,
    loadFile,
    fileName,
    rows: frames.map((frame) => toRow(frame, selected.has(frame.index))),
    selectedCount: selected.size,
    allSelected,
    toggle,
    toggleAll,
    enqueue,
    parsing: parsing.running,
    enqueuing: enqueuing.running,
  }
}
