import { useCallback, useEffect, useState } from 'react'
import type { ScenarioSummary } from '../../../shared/settings'
import { useSimulator } from '../../contexts/SimulatorContext'
import { useAction } from '../../hooks/useAction'
import { simulatorApi } from '../../services/simulatorApi'

export type PendingScenarioAction = { kind: 'load' | 'delete'; scenario: ScenarioSummary }

export function useScenarios() {
  const { online, replaceSnapshot, catalog } = useSimulator()
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([])
  const [name, setNameState] = useState('')
  const [pending, setPending] = useState<PendingScenarioAction | null>(null)
  const listing = useAction()
  const saving = useAction()
  const confirming = useAction()
  const { run: runList } = listing

  const refresh = useCallback(async () => {
    const list = await runList(() => simulatorApi.listScenarios())
    if (list) setScenarios(list)
  }, [runList])

  useEffect(() => {
    if (online) refresh()
  }, [online, refresh])

  const setName = (value: string) => {
    saving.clearFieldError('name')
    setNameState(value)
  }

  const save = async () => {
    const list = await saving.run(() => simulatorApi.saveScenario(name), { success: `Cenário "${name.trim()}" salvo` })
    if (!list) return
    setScenarios(list)
    setNameState('')
  }

  const confirm = async () => {
    if (!pending) return
    const { kind, scenario } = pending
    if (kind === 'load') {
      const snapshot = await confirming.run(() => simulatorApi.loadScenario(scenario.name), { success: `Cenário "${scenario.name}" carregado` })
      if (snapshot) replaceSnapshot(snapshot)
      if (snapshot) setPending(null)
      return
    }
    const list = await confirming.run(() => simulatorApi.deleteScenario(scenario.name), { success: `Cenário "${scenario.name}" removido` })
    if (list) {
      setScenarios(list)
      setPending(null)
    }
  }

  const behaviorLabel = (behaviorId: string) => catalog?.behaviors.find((behavior) => behavior.id === behaviorId)?.label ?? behaviorId

  return {
    scenarios,
    name,
    setName,
    nameError: saving.fieldError('name'),
    save,
    saving: saving.running,
    pending,
    requestLoad: (scenario: ScenarioSummary) => setPending({ kind: 'load', scenario }),
    requestDelete: (scenario: ScenarioSummary) => setPending({ kind: 'delete', scenario }),
    cancel: () => setPending(null),
    confirm,
    confirmingAction: confirming.running,
    behaviorLabel,
  }
}
