import { FaCheck, FaSlidersH, FaUndo } from 'react-icons/fa'
import { Button, Input, Panel, Select } from '../../../components/globals'
import { parseInteger } from '../../../utils/format'
import * as h from '../hooks'
import * as S from '../styles'

export function ResponseProfileCard() {
  const profile = h.useResponseProfile()

  return (
    <Panel title="Resposta ao poll" icon={<FaSlidersH />} scroll={false}>
      <S.Stack>
        <Select label="Comportamento" options={profile.behaviorOptions} value={profile.profile.behaviorId} onChange={profile.selectBehavior} />
        {profile.descriptor && <S.Description>{profile.descriptor.description}</S.Description>}
        {profile.descriptor && profile.descriptor.params.length > 0 && (
          <S.Grid>
            {profile.descriptor.params.map((param) => (
              <Input
                key={param.key}
                type="number"
                label={param.label}
                suffix={param.unit}
                min={param.min}
                max={param.max}
                value={Number.isFinite(profile.params[param.key]) ? profile.params[param.key] : ''}
                onChange={(event) => profile.setParam(param.key, parseInteger(event.target.value))}
              />
            ))}
          </S.Grid>
        )}
        <Select label="ACK (0xB0)" options={h.ACK_OPTIONS} value={profile.profile.ackMode} onChange={profile.setAckMode} />
        <S.Grid>
          <Input
            type="number"
            label="Atraso antes de responder"
            suffix="ms"
            min={0}
            value={profile.profile.responseDelayMs}
            onChange={(event) => profile.setDelay(parseInteger(event.target.value))}
          />
          <Input
            type="number"
            label="Variação aleatória"
            suffix="ms"
            min={0}
            value={profile.profile.jitterMs}
            onChange={(event) => profile.setJitter(parseInteger(event.target.value))}
          />
        </S.Grid>
        <S.Hint>O Main.java espera no máximo ~750 ms sem dado antes de reenviar o poll.</S.Hint>
        <S.Actions>
          <Button variant="secondary" icon={<FaUndo />} onClick={profile.discard} disabled={!profile.dirty || profile.running}>
            Descartar
          </Button>
          <Button icon={<FaCheck />} onClick={profile.apply} loading={profile.running} disabled={!profile.dirty}>
            Aplicar
          </Button>
        </S.Actions>
      </S.Stack>
    </Panel>
  )
}
