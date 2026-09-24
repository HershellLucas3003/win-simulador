import { FaFolderOpen, FaSave, FaTrash } from 'react-icons/fa'
import { Button, EmptyState, Input, Modal, Panel } from '../../../components/globals'
import * as h from '../hooks'
import * as S from '../styles'

export function ScenarioPanel() {
  const scenarios = h.useScenarios()
  const pending = scenarios.pending

  return (
    <Panel title="Cenários salvos" icon={<FaFolderOpen />}>
      <S.Hint>Um cenário guarda o comportamento de resposta, o desvio de relógio, o tempo da câmera e todos os eventos. Credenciais do FTP não entram.</S.Hint>
      <S.SaveRow>
        <Input label="Nome do cenário" value={scenarios.name} error={scenarios.nameError} onChange={(change) => scenarios.setName(change.target.value)} />
        <Button icon={<FaSave />} onClick={scenarios.save} loading={scenarios.saving}>
          Salvar atual
        </Button>
      </S.SaveRow>

      {scenarios.scenarios.length === 0 ? (
        <EmptyState icon={<FaFolderOpen />}>Nenhum cenário salvo ainda.</EmptyState>
      ) : (
        <S.Table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Resposta</th>
              <th>Eventos</th>
              <th>Salvo em</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {scenarios.scenarios.map((scenario) => (
              <tr key={scenario.name}>
                <td>{scenario.name}</td>
                <td>{scenarios.behaviorLabel(scenario.behaviorId)}</td>
                <td>{scenario.events}</td>
                <td>{new Date(scenario.savedAt).toLocaleString('pt-BR')}</td>
                <S.RowActions>
                  <Button size="sm" variant="secondary" icon={<FaFolderOpen />} onClick={() => scenarios.requestLoad(scenario)}>
                    Carregar
                  </Button>
                  <Button size="sm" variant="danger" icon={<FaTrash />} onClick={() => scenarios.requestDelete(scenario)} aria-label={`Remover ${scenario.name}`} />
                </S.RowActions>
              </tr>
            ))}
          </tbody>
        </S.Table>
      )}

      {pending && (
        <Modal
          title={pending.kind === 'load' ? 'Carregar cenário' : 'Remover cenário'}
          onSummit={scenarios.confirm}
          onCancel={scenarios.cancel}
          onSummitName={pending.kind === 'load' ? 'Carregar' : 'Remover'}
          submitting={scenarios.confirmingAction}
          danger={pending.kind === 'delete'}
        >
          {pending.kind === 'load'
            ? `Carregar "${pending.scenario.name}" substitui os eventos e o comportamento atuais. Continuar?`
            : `Remover o cenário "${pending.scenario.name}"?`}
        </Modal>
      )}
    </Panel>
  )
}
