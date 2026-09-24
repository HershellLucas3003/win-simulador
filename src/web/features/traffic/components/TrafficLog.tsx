import { FaDownload, FaEraser, FaPause, FaPlay, FaTerminal } from 'react-icons/fa'
import { Button, Checkbox, Input, Panel } from '../../../components/globals'
import * as h from '../hooks'
import * as S from '../styles'

export function TrafficLog() {
  const log = h.useTrafficLog()

  return (
    <Panel title="Tráfego serial e eventos" icon={<FaTerminal />} padded={false} scroll={false}>
      <S.Toolbar>
        <Checkbox label="Ocultar polls sem dado" checked={log.hidePolls} onChange={log.setHidePolls} />
        {h.TRAFFIC_KINDS.map((kind) => (
          <Checkbox key={kind} label={kind.toUpperCase()} checked={log.kinds.has(kind)} onChange={() => log.toggleKind(kind)} />
        ))}
        <Input type="search" placeholder="Filtrar texto ou hex" value={log.search} onChange={(change) => log.setSearch(change.target.value)} aria-label="Filtrar log" />
        <S.Spacer />
        <Button variant="secondary" size="sm" icon={log.paused ? <FaPlay /> : <FaPause />} onClick={log.togglePause}>
          {log.paused ? 'Continuar' : 'Pausar'}
        </Button>
        <Button variant="secondary" size="sm" icon={<FaEraser />} onClick={log.clear}>
          Limpar tela
        </Button>
        <Button variant="secondary" size="sm" icon={<FaDownload />} onClick={log.exportLog}>
          Exportar
        </Button>
      </S.Toolbar>
      <S.Console>
        {log.entries.length === 0 && <S.Empty>Sem tráfego ainda. Abra a porta COM e rode o WIM-Service na outra ponta do par.</S.Empty>}
        {log.entries.map((entry) => (
          <S.Line key={entry.seq}>
            <S.Time>{entry.at.slice(11)} </S.Time>
            <S.Kind $kind={entry.kind}>{entry.kind.toUpperCase()}</S.Kind>
            {entry.message}
            {entry.hex && <S.Hex>: {entry.hex}</S.Hex>}
          </S.Line>
        ))}
        <div ref={log.endRef} />
      </S.Console>
    </Panel>
  )
}
