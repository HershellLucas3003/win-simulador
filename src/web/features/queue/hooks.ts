import { useState } from 'react'
import type { FrameSource, QueuedFrameView } from '../../../shared/equipment'
import type { ActiveVehicleView } from '../../../shared/events'
import type { BadgeTone } from '../../components/globals'
import { useSimulator } from '../../contexts/SimulatorContext'
import { useAction } from '../../hooks/useAction'
import { simulatorApi } from '../../services/simulatorApi'
import { formatKg, formatSeconds, formatSpeed } from '../../utils/format'

const SOURCE_LABEL: Record<FrameSource, string> = { generated: 'evento', manual: 'manual', replay: 'replay' }

export interface QueueItemView {
  id: string
  title: string
  subtitle: string
  source: string
  status: { tone: BadgeTone; label: string }
  preset: string | null
}

function toQueueItem(frame: QueuedFrameView, position: number): QueueItemView {
  const status: QueueItemView['status'] = frame.awaitingAck
    ? { tone: 'warning', label: `aguardando ACK (envio ${frame.sendCount})` }
    : frame.sendCount > 0
      ? { tone: 'error', label: `reenvio pendente (${frame.sendCount} enviados)` }
      : position === 0
        ? { tone: 'info', label: 'próximo poll' }
        : { tone: 'neutral', label: `posição ${position + 1}` }
  return {
    id: frame.id,
    title: `Serial ${frame.serial}${frame.plate ? ` · ${frame.plate}` : ''}`,
    subtitle: `classe ${frame.classIndex}${frame.classCode ? ` (${frame.classCode})` : ''} · ${frame.numAxles} eixos · ${formatKg(frame.gross)} · ${formatSpeed(frame.speedKmh)}`,
    source: SOURCE_LABEL[frame.source],
    status,
    preset: frame.presetId,
  }
}

export function useEquipmentQueue() {
  const { snapshot } = useSimulator()
  const { run, running } = useAction()
  const [confirmingClear, setConfirmingClear] = useState(false)
  const items = (snapshot?.queue ?? []).map(toQueueItem)

  const remove = (id: string) => run(() => simulatorApi.removeFromQueue(id))
  const requestClear = () => setConfirmingClear(true)
  const cancelClear = () => setConfirmingClear(false)
  const confirmClear = async () => {
    const cleared = await run(() => simulatorApi.clearQueue(), { success: 'Fila limpa' })
    if (cleared) setConfirmingClear(false)
  }

  return { items, running, remove, confirmingClear, requestClear, cancelClear, confirmClear }
}

export interface TransitItemView {
  id: string
  plate: string
  escapePlate: string | null
  classLabel: string
  details: string
  axles: string
  overweight: boolean
  preset: string | null
  appear: { progress: number; label: string; visible: boolean }
  escape: { progress: number; label: string; visible: boolean }
}

function toTransitItem(vehicle: ActiveVehicleView): TransitItemView {
  const appearing = vehicle.phase === 'waiting'
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    escapePlate: vehicle.escapePlate,
    classLabel: vehicle.classLabel,
    details: `${vehicle.numAxles} eixos · ${formatKg(vehicle.gross)} · ${formatSpeed(vehicle.speedKmh)}`,
    axles: vehicle.axleWeights.slice(0, 10).map((weight) => formatKg(weight)).join(' · '),
    overweight: vehicle.overweight,
    preset: vehicle.presetId,
    appear: {
      progress: vehicle.appearProgress,
      label: appearing ? `aparece em ${formatSeconds(vehicle.appearRemainingMs)}` : 'passou pela balança',
      visible: true,
    },
    escape: {
      progress: vehicle.escapeProgress,
      label: vehicle.phase === 'done' ? 'passou pela câmera de fuga' : `câmera de fuga em ${formatSeconds(vehicle.escapeRemainingMs)}`,
      visible: vehicle.willEscape,
    },
  }
}

export function useTransitVehicles() {
  const { vehicles } = useSimulator()
  return { items: vehicles.map(toTransitItem) }
}
