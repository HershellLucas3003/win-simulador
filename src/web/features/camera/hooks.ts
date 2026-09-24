import type { CameraTimingMode, NoPlateNaming } from '../../../shared/camera'
import { DEFAULT_CAMERA_SETTINGS } from '../../../shared/camera'
import type { CameraSettingsView } from '../../../shared/snapshot'
import type { BadgeTone, SelectOption } from '../../components/globals'
import { useSimulator } from '../../contexts/SimulatorContext'
import { useAction } from '../../hooks/useAction'
import { useDraft } from '../../hooks/useDraft'
import { simulatorApi } from '../../services/simulatorApi'

export const REAL_CAMERA_OFFSET_SECONDS = 173

export const TIMING_OPTIONS: SelectOption[] = [
  { value: 'before-frame', label: 'Imagem antes do frame (ordem normal)' },
  { value: 'after-frame', label: 'Imagem depois do frame (câmera atrasada)' },
  { value: 'none', label: 'Sem imagem (câmera fora)' },
]

export const NO_PLATE_OPTIONS: SelectOption[] = [
  { value: 'unknown', label: 'WIM_XX_<data>_unknown.jpg' },
  { value: 'empty', label: 'WIM_XX_<data>_.jpg' },
]

interface CameraForm extends Omit<CameraSettingsView, 'hasPassword' | 'clockOffsetMs'> {
  clockOffsetSeconds: number
  password: string
}

const toForm = (camera: CameraSettingsView): CameraForm => {
  const { hasPassword: _hasPassword, clockOffsetMs, ...rest } = camera
  return { ...rest, clockOffsetSeconds: Math.round(clockOffsetMs / 1000), password: '' }
}

const FALLBACK: CameraSettingsView = { ...DEFAULT_CAMERA_SETTINGS, hasPassword: false }

export function useCameraSettings() {
  const { snapshot } = useSimulator()
  const source = snapshot?.camera ?? FALLBACK
  const draft = useDraft<CameraForm>(toForm(source), JSON.stringify(source))
  const { run, running, fieldError, clearFieldError } = useAction()

  const set = <K extends keyof CameraForm>(key: K, value: CameraForm[K]) => {
    clearFieldError(key === 'clockOffsetSeconds' ? 'clockOffsetMs' : key)
    draft.patch({ [key]: value } as Partial<CameraForm>)
  }

  const save = async () => {
    const { clockOffsetSeconds, password, ...rest } = draft.value
    const saved = await run(
      () => simulatorApi.updateCamera({ ...rest, clockOffsetMs: Math.round(clockOffsetSeconds * 1000), password: password === '' ? null : password }),
      { success: 'Câmera atualizada' },
    )
    if (saved) {
      draft.patch({ password: '' })
      draft.markSaved()
    }
  }

  return {
    form: draft.value,
    hasPassword: source.hasPassword,
    dirty: draft.dirty,
    saving: running,
    fieldError: (key: string) => fieldError(key),
    setText: (key: 'host' | 'user' | 'password' | 'rootDir', value: string) => set(key, value),
    setNumber: (key: 'port' | 'delayMs' | 'missingPlateChance' | 'clockOffsetSeconds', value: number) => set(key, value),
    setEnabled: (value: boolean) => set('enabled', value),
    setUploadEscape: (value: boolean) => set('uploadEscape', value),
    setTimingMode: (value: string) => set('timingMode', value as CameraTimingMode),
    setNoPlateNaming: (value: string) => set('noPlateNaming', value as NoPlateNaming),
    applyRealOffset: () => set('clockOffsetSeconds', REAL_CAMERA_OFFSET_SECONDS),
    save,
    discard: draft.reset,
  }
}

export function useCameraStatus() {
  const { snapshot } = useSimulator()
  const { run, running } = useAction()
  const status = snapshot?.cameraStatus
  const enabled = Boolean(snapshot?.camera.enabled)

  const badge: { tone: BadgeTone; label: string } = !enabled
    ? { tone: 'neutral', label: 'desligada' }
    : status?.lastError
      ? { tone: 'error', label: 'com erro' }
      : status?.connected
        ? { tone: 'success', label: 'conectada' }
        : { tone: 'info', label: 'aguardando primeiro envio' }

  return {
    badge,
    uploads: status?.uploads ?? 0,
    failures: status?.failures ?? 0,
    lastUpload: status?.lastUpload ?? null,
    lastError: status?.lastError ?? null,
    test: () => run(() => simulatorApi.testCamera(), { success: 'FTP respondeu' }),
    testing: running,
  }
}
