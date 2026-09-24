import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SerialPortInfo } from '../../../shared/equipment'
import type { BadgeTone, SelectOption } from '../../components/globals'
import { useSimulator } from '../../contexts/SimulatorContext'
import { useAction } from '../../hooks/useAction'
import { simulatorApi } from '../../services/simulatorApi'

export function useSerialPorts() {
  const { online, snapshot } = useSimulator()
  const [ports, setPorts] = useState<SerialPortInfo[]>([])
  const [selected, setSelected] = useState('')
  const { run, running } = useAction()

  const refresh = useCallback(async () => {
    const list = await run(() => simulatorApi.listPorts())
    if (list) setPorts(list)
  }, [run])

  useEffect(() => {
    if (online) refresh()
  }, [online, refresh])

  const currentPath = snapshot?.serial.path ?? snapshot?.settings.lastPort ?? ''
  useEffect(() => {
    if (!selected && currentPath) setSelected(currentPath)
  }, [currentPath, selected])

  const options = useMemo<SelectOption[]>(() => {
    const known = ports.map((port) => ({ value: port.path, label: port.friendlyName ?? port.path }))
    if (currentPath && !ports.some((port) => port.path === currentPath)) known.unshift({ value: currentPath, label: `${currentPath} (não encontrada)` })
    return known
  }, [ports, currentPath])

  return { options, selected, setSelected, refresh, refreshing: running }
}

export function useSerialConnection(selected: string) {
  const { snapshot } = useSimulator()
  const { run, running, fieldError } = useAction()
  const serial = snapshot?.serial
  const isOpen = Boolean(serial?.open)
  const isRetrying = Boolean(!serial?.open && serial?.path)

  const toggle = useCallback(() => {
    if (isOpen || isRetrying) return run(() => simulatorApi.closePort(), { success: 'Porta fechada' })
    return run(() => simulatorApi.openPort(selected), { success: `Porta ${selected} aberta` })
  }, [run, isOpen, isRetrying, selected])

  return { isOpen, isRetrying, toggle, running, portError: fieldError('port') }
}

export interface StatusSummary {
  tone: BadgeTone
  label: string
  detail: string | null
}

export function useConnectionSummary(): { backend: StatusSummary; serial: StatusSummary } {
  const { online, snapshot } = useSimulator()
  const serial = snapshot?.serial

  const backend: StatusSummary = online
    ? { tone: 'success', label: 'Servidor conectado', detail: null }
    : { tone: 'error', label: 'Servidor offline', detail: 'Rode npm run dev no simulador' }

  const serialSummary: StatusSummary = serial?.open
    ? { tone: 'success', label: `${serial.path} aberta`, detail: '115200 8N1' }
    : serial?.path
      ? { tone: 'warning', label: `Reconectando ${serial.path}`, detail: serial.error }
      : { tone: 'neutral', label: 'Porta fechada', detail: null }

  return { backend, serial: serialSummary }
}

export function useEquipmentCounters() {
  const { snapshot } = useSimulator()
  const stats = snapshot?.stats
  return [
    { key: 'polls', label: 'Polls', value: stats?.polls ?? 0 },
    { key: 'empty', label: 'Sem dado', value: stats?.emptyResponses ?? 0 },
    { key: 'data', label: 'Frames', value: stats?.dataResponses ?? 0 },
    { key: 'acks', label: 'ACK', value: stats?.acks ?? 0 },
    { key: 'delivered', label: 'Entregues', value: stats?.delivered ?? 0 },
    { key: 'queue', label: 'Na fila', value: snapshot?.queue.length ?? 0 },
  ]
}
