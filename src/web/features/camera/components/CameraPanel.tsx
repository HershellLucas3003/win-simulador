import { FaCamera, FaClock, FaNetworkWired, FaSave, FaUndo } from 'react-icons/fa'
import { Badge, Button, Checkbox, Input, Panel, Select } from '../../../components/globals'
import { formatNumber, formatOffset, parseInteger } from '../../../utils/format'
import * as h from '../hooks'
import * as S from '../styles'

export function CameraPanel() {
  const camera = h.useCameraSettings()
  const status = h.useCameraStatus()
  const { form } = camera

  return (
    <S.Layout>
      <Panel title="Câmera (FTP)" icon={<FaCamera />} scroll={false}>
        <S.Stack>
          <Checkbox label="Enviar imagens para o FTP" checked={form.enabled} onChange={camera.setEnabled} />
          <S.Grid $columns={3}>
            <Input label="Host" value={form.host} error={camera.fieldError('host')} onChange={(change) => camera.setText('host', change.target.value)} />
            <Input
              type="number"
              label="Porta"
              value={Number.isFinite(form.port) ? form.port : ''}
              error={camera.fieldError('port')}
              onChange={(change) => camera.setNumber('port', parseInteger(change.target.value))}
            />
            <Input label="Pasta raiz" value={form.rootDir} error={camera.fieldError('rootDir')} onChange={(change) => camera.setText('rootDir', change.target.value)} />
            <Input label="Usuário" value={form.user} error={camera.fieldError('user')} onChange={(change) => camera.setText('user', change.target.value)} />
            <Input
              type="password"
              label="Senha"
              autoComplete="new-password"
              placeholder={camera.hasPassword ? 'mantida (digite para trocar)' : ''}
              value={form.password}
              onChange={(change) => camera.setText('password', change.target.value)}
            />
          </S.Grid>
          <S.Hint>Use um FTP local de teste. Não aponte para o FTP do cliente.</S.Hint>

          <S.Grid>
            <Select label="Momento da imagem" options={h.TIMING_OPTIONS} value={form.timingMode} error={camera.fieldError('timingMode')} onChange={camera.setTimingMode} />
            <Input
              type="number"
              label="Diferença entre imagem e frame"
              suffix="ms"
              min={0}
              value={Number.isFinite(form.delayMs) ? form.delayMs : ''}
              error={camera.fieldError('delayMs')}
              onChange={(change) => camera.setNumber('delayMs', parseInteger(change.target.value))}
            />
            <Input
              type="number"
              label="Chance de placa não lida"
              suffix="%"
              min={0}
              max={100}
              value={Number.isFinite(form.missingPlateChance) ? form.missingPlateChance : ''}
              error={camera.fieldError('missingPlateChance')}
              onChange={(change) => camera.setNumber('missingPlateChance', parseInteger(change.target.value))}
            />
            <Select label="Nome sem placa" options={h.NO_PLATE_OPTIONS} value={form.noPlateNaming} error={camera.fieldError('noPlateNaming')} onChange={camera.setNoPlateNaming} />
            <Input
              type="number"
              label="Desvio do relógio da câmera"
              suffix="s"
              value={Number.isFinite(form.clockOffsetSeconds) ? form.clockOffsetSeconds : ''}
              error={camera.fieldError('clockOffsetMs')}
              onChange={(change) => camera.setNumber('clockOffsetSeconds', parseInteger(change.target.value))}
            />
          </S.Grid>
          <Checkbox label="Enviar imagem de fuga (WIM_XX_ESCAPE)" checked={form.uploadEscape} onChange={camera.setUploadEscape} />
          <S.Hint>Nome do arquivo com o relógio da câmera: {formatOffset(form.clockOffsetSeconds * 1000)} em relação ao host.</S.Hint>

          <S.Actions>
            <Button variant="secondary" icon={<FaClock />} onClick={camera.applyRealOffset}>
              Desvio do log real (+2 min 53 s)
            </Button>
            <Button variant="secondary" icon={<FaUndo />} onClick={camera.discard} disabled={!camera.dirty || camera.saving}>
              Descartar
            </Button>
            <Button icon={<FaSave />} onClick={camera.save} loading={camera.saving} disabled={!camera.dirty}>
              Salvar câmera
            </Button>
          </S.Actions>
        </S.Stack>
      </Panel>

      <Panel title="Status do FTP" icon={<FaNetworkWired />} actions={<Badge tone={status.badge.tone}>{status.badge.label}</Badge>} scroll={false}>
        <S.Stack>
          <S.Stats>
            <dt>Enviados</dt>
            <dd>{formatNumber(status.uploads)}</dd>
            <dt>Falhas</dt>
            <dd>{formatNumber(status.failures)}</dd>
            <dt>Último</dt>
            <dd>{status.lastUpload ?? '-'}</dd>
            {status.lastError && (
              <>
                <dt>Erro</dt>
                <S.ErrorText>{status.lastError}</S.ErrorText>
              </>
            )}
          </S.Stats>
          <S.Actions>
            <Button variant="secondary" icon={<FaNetworkWired />} onClick={status.test} loading={status.testing}>
              Testar conexão
            </Button>
          </S.Actions>
        </S.Stack>
      </Panel>
    </S.Layout>
  )
}
