import { useEffect, useMemo, useRef, useState } from 'react'
import type { TrafficEntry, TrafficKind } from '../../../shared/equipment'
import { useSimulator } from '../../contexts/SimulatorContext'

const VISIBLE_LIMIT = 600
export const TRAFFIC_KINDS: TrafficKind[] = ['rx', 'tx', 'info', 'warn', 'error']

const formatLine = (entry: TrafficEntry) => `[${entry.at}] [${entry.kind.toUpperCase()}] ${entry.message}${entry.hex ? `: ${entry.hex}` : ''}`

export function useTrafficLog() {
  const { traffic } = useSimulator()
  const [hidePolls, setHidePolls] = useState(true)
  const [kinds, setKinds] = useState<Set<TrafficKind>>(new Set(TRAFFIC_KINDS))
  const [search, setSearch] = useState('')
  const [frozen, setFrozen] = useState<TrafficEntry[] | null>(null)
  const [clearedAt, setClearedAt] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  const source = frozen ?? traffic

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = source.filter(
      (entry) =>
        entry.seq > clearedAt &&
        kinds.has(entry.kind) &&
        !(hidePolls && entry.isPoll) &&
        (!term || entry.message.toLowerCase().includes(term) || (entry.hex ?? '').toLowerCase().includes(term)),
    )
    return filtered.slice(-VISIBLE_LIMIT)
  }, [source, clearedAt, kinds, hidePolls, search])

  useEffect(() => {
    if (!frozen) endRef.current?.scrollIntoView({ block: 'end' })
  }, [visible, frozen])

  const toggleKind = (kind: TrafficKind) =>
    setKinds((current) => {
      const next = new Set(current)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })

  const togglePause = () => setFrozen((current) => (current ? null : traffic))

  const clear = () => setClearedAt(traffic.at(-1)?.seq ?? 0)

  const exportLog = () => {
    const blob = new Blob([visible.map(formatLine).join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `simulador-wim-${new Date().toISOString().replace(/[:.]/g, '-')}.log`
    link.click()
    URL.revokeObjectURL(url)
  }

  return {
    entries: visible,
    endRef,
    hidePolls,
    setHidePolls,
    kinds,
    toggleKind,
    search,
    setSearch,
    paused: frozen !== null,
    togglePause,
    clear,
    exportLog,
  }
}
