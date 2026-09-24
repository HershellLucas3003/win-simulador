import type { CameraSettings } from '../../shared/camera'
import type { EventConfig, RandomRange } from '../../shared/events'
import type { FieldErrors } from '../../shared/validation'

export class ValidationError extends Error {
  constructor(readonly fields: FieldErrors) {
    super('validation')
  }
}

interface RangeRule {
  field: keyof EventConfig
  min: number
  max: number
}

const EVENT_RANGE_RULES: RangeRule[] = [
  { field: 'lane', min: 0, max: 0xffff },
  { field: 'appearTimeMs', min: 0, max: 3600000 },
  { field: 'escapeTimeMs', min: 0, max: 3600000 },
  { field: 'speedKmh', min: 0, max: 6553 },
  { field: 'axleWeightKg', min: 0, max: 0xffff },
  { field: 'axleDistanceCm', min: 0, max: 0xffff },
  { field: 'temperatureC', min: -100, max: 200 },
  { field: 'autoEmitDelayMs', min: 1000, max: 86400000 },
]

const isInteger = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)

function checkRange(errors: FieldErrors, field: string, value: RandomRange | undefined, min: number, max: number) {
  if (!value || !isInteger(value.min) || value.min < min || value.min > max) errors[`${field}.min`] = `inteiro entre ${min} e ${max}`
  if (!value || !isInteger(value.max) || value.max < min || value.max > max) errors[`${field}.max`] = `inteiro entre ${min} e ${max}`
}

function checkPercent(errors: FieldErrors, field: string, value: number | undefined) {
  if (!isInteger(value) || value < 0 || value > 100) errors[field] = 'percentual entre 0 e 100'
}

export function validateEvent(config: EventConfig, presetIds: Set<string>): EventConfig {
  const errors: FieldErrors = {}
  if (!config.name || config.name.trim().length === 0) errors.name = 'informe um nome'
  if (config.name && config.name.length > 60) errors.name = 'máximo de 60 caracteres'
  if (config.classIndex !== null && (!isInteger(config.classIndex) || config.classIndex < 0 || config.classIndex > 0xffff)) {
    errors.classIndex = 'índice de classe inválido'
  }
  if (config.presetId !== null && !presetIds.has(config.presetId)) errors.presetId = 'cenário de veículo desconhecido'
  EVENT_RANGE_RULES.forEach((rule) => checkRange(errors, rule.field, config[rule.field] as RandomRange, rule.min, rule.max))
  checkPercent(errors, 'differentPlateChance.percent', config.differentPlateChance?.percent)
  checkPercent(errors, 'escapeChance.percent', config.escapeChance?.percent)

  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
  return { ...config, name: config.name.trim(), autoEmit: Boolean(config.autoEmit) }
}

export function validateCamera(camera: CameraSettings): CameraSettings {
  const errors: FieldErrors = {}
  if (camera.enabled && !camera.host.trim()) errors.host = 'informe o host do FTP'
  if (!isInteger(camera.port) || camera.port < 1 || camera.port > 65535) errors.port = 'porta entre 1 e 65535'
  if (camera.enabled && !camera.user.trim()) errors.user = 'informe o usuário'
  if (!isInteger(camera.delayMs) || camera.delayMs < 0 || camera.delayMs > 600000) errors.delayMs = 'entre 0 e 600000 ms'
  checkPercent(errors, 'missingPlateChance', camera.missingPlateChance)
  if (!isInteger(camera.clockOffsetMs) || Math.abs(camera.clockOffsetMs) > 86400000) errors.clockOffsetMs = 'até 24 h para mais ou para menos'
  if (/[\\:*?"<>|]/.test(camera.rootDir)) errors.rootDir = 'caractere inválido para pasta'
  if (!['before-frame', 'after-frame', 'none'].includes(camera.timingMode)) errors.timingMode = 'modo desconhecido'
  if (!['unknown', 'empty'].includes(camera.noPlateNaming)) errors.noPlateNaming = 'opção desconhecida'
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
  return { ...camera, host: camera.host.trim(), user: camera.user.trim(), rootDir: camera.rootDir.trim().replace(/^\/+|\/+$/g, '') }
}

export function validateSiteAndClock(siteId: number, equipmentClockOffsetMs: number): void {
  const errors: FieldErrors = {}
  if (!isInteger(siteId) || siteId < 0 || siteId > 99) errors.siteId = 'site entre 0 e 99'
  if (!isInteger(equipmentClockOffsetMs) || Math.abs(equipmentClockOffsetMs) > 86400000) {
    errors.equipmentClockOffsetMs = 'até 24 h para mais ou para menos'
  }
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
}

export function validateSerialNumber(value: number): void {
  if (!isInteger(value) || value < 0 || value > 0xffffffff) throw new ValidationError({ nextSerial: 'inteiro entre 0 e 4294967295' })
}
