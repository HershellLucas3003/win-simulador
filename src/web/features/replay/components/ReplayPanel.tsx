import { FaFileUpload, FaHistory, FaPaperPlane } from 'react-icons/fa'
import { Button, Checkbox, EmptyState, Panel } from '../../../components/globals'
import * as h from '../hooks'
import * as S from '../styles'

export function ReplayPanel() {
  const replay = h.useReplay()

  return (
    <Panel title="Replay de log do WIM-Service" icon={<FaHistory />} padded={false}>
      <S.Toolbar>
        <S.HiddenFile ref={replay.inputRef} type="file" accept=".txt,.log,text/plain" onChange={replay.loadFile} />
        <Button variant="secondary" icon={<FaFileUpload />} onClick={replay.openPicker} loading={replay.parsing}>
          Abrir log
        </Button>
        {replay.fileName && <S.FileName>{replay.fileName}</S.FileName>}
        <S.Spacer />
        {replay.rows.length > 0 && <Checkbox label="Todos" checked={replay.allSelected} onChange={replay.toggleAll} />}
        <Button icon={<FaPaperPlane />} onClick={replay.enqueue} loading={replay.enqueuing} disabled={replay.selectedCount === 0}>
          Enfileirar {replay.selectedCount}
        </Button>
      </S.Toolbar>
      {replay.rows.length === 0 ? (
        <EmptyState icon={<FaHistory />}>
          Abra um log do Main.java (ex.: WIM-Service/logs). Os frames FF 06 reais são reenviados byte a byte pelo equipamento simulado.
        </EmptyState>
      ) : (
        <S.List>
          {replay.rows.map((row) => (
            <S.Row key={row.index} $selected={row.selected}>
              <Checkbox label="" checked={row.selected} onChange={() => replay.toggle(row.index)} />
              <S.RowBody>
                <S.Title>{row.title}</S.Title>
                <S.Muted>{row.details}</S.Muted>
                <S.Muted>{row.origin}</S.Muted>
                <S.Hex title={row.hex}>{row.hex}</S.Hex>
              </S.RowBody>
            </S.Row>
          ))}
        </S.List>
      )}
    </Panel>
  )
}
