import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_CAMERA_SETTINGS } from '../../src/shared/camera'
import { DEFAULT_RESPONSE_PROFILE } from '../../src/shared/scenario'
import { JsonFileStore } from '../../src/server/config/JsonFileStore'
import { importRustConfig } from '../../src/server/config/rustConfigImporter'
import { SimulatorRepository } from '../../src/server/config/SimulatorRepository'
import { ValidationError, validateCamera, validateEvent } from '../../src/server/config/validators'
import { defaultEventConfig } from '../../src/server/generation/eventDefaults'
import { listPresets } from '../../src/server/generation/presets'
import { clientCatalog } from '../helpers/catalog'

const RUST_CONFIG = fileURLToPath(new URL('../../../simulate_wim/config.json', import.meta.url))
const presetIds = new Set(listPresets().map((preset) => preset.id))

describe('importador do config.json do simulate_wim', () => {
  it('importa os 8 eventos sem perder campo', () => {
    let id = 0
    const events = importRustConfig(JSON.parse(readFileSync(RUST_CONFIG, 'utf8')), clientCatalog(), () => `evt-${++id}`)
    expect(events).toHaveLength(8)
    expect(events[0]).toMatchObject({
      name: 'Caminhão',
      classIndex: 27,
      appearTimeMs: { min: 5000, max: 10000, random: true },
      speedKmh: { min: 10, max: 110, random: true },
      axleWeightKg: { min: 9000, max: 10000, random: true },
      differentPlateChance: { percent: 50, always: true, alwaysValue: false },
      autoEmitDelayMs: { min: 45000, max: 120000, random: true },
      autoEmit: false,
    })
    events.forEach((event) => expect(() => validateEvent(event, presetIds)).not.toThrow())
  })

  it('rejeita formato que não é lista', () => {
    expect(() => importRustConfig({}, clientCatalog(), () => 'x')).toThrow()
  })
})

describe('validação de evento com erro por campo', () => {
  const base = defaultEventConfig(clientCatalog(), 'e', 'Carro', 77)

  const fieldsOf = (action: () => unknown) => {
    try {
      action()
    } catch (error) {
      if (error instanceof ValidationError) return error.fields
      throw error
    }
    return {}
  }

  it('aceita o padrão', () => {
    expect(validateEvent(base, presetIds).name).toBe('Carro')
  })

  it('aponta cada campo inválido', () => {
    const fields = fieldsOf(() =>
      validateEvent(
        {
          ...base,
          name: ' ',
          speedKmh: { min: -1, max: 9000, random: true },
          escapeChance: { percent: 150, always: false, alwaysValue: true },
          presetId: 'nao-existe',
        },
        presetIds,
      ),
    )
    expect(Object.keys(fields).sort()).toEqual(['escapeChance.percent', 'name', 'presetId', 'speedKmh.max', 'speedKmh.min'])
  })

  it('peso por eixo acima de u16 é recusado antes de virar frame', () => {
    expect(fieldsOf(() => validateEvent({ ...base, axleWeightKg: { min: 1, max: 70000, random: true } }, presetIds))).toHaveProperty('axleWeightKg.max')
  })

  it('câmera ligada exige host e usuário', () => {
    const fields = fieldsOf(() => validateCamera({ ...DEFAULT_CAMERA_SETTINGS, enabled: true, host: '', user: '', port: 0 }))
    expect(Object.keys(fields).sort()).toEqual(['host', 'port', 'user'])
  })
})

describe('SimulatorRepository', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'wim-sim-'))
  const repository = new SimulatorRepository(new JsonFileStore(dir))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('salva e carrega cenário', async () => {
    const scenario = {
      name: 'rajada desalinhada',
      savedAt: new Date().toISOString(),
      profile: { ...DEFAULT_RESPONSE_PROFILE, behaviorId: 'misaligned' },
      equipmentClockOffsetMs: -206000,
      camera: {
        timingMode: 'after-frame' as const,
        delayMs: 3000,
        missingPlateChance: 20,
        noPlateNaming: 'unknown' as const,
        uploadEscape: true,
        clockOffsetMs: 170000,
      },
      events: [defaultEventConfig(clientCatalog(), 'e', 'Carro', 77)],
    }
    await repository.saveScenario(scenario)
    expect(await repository.loadScenario('rajada desalinhada')).toEqual(scenario)
    expect(await repository.listScenarios()).toEqual([{ name: 'rajada desalinhada', savedAt: scenario.savedAt, events: 1, behaviorId: 'misaligned' }])
  })

  it('recusa nome de cenário com caminho', async () => {
    await expect(repository.loadScenario('../settings')).rejects.toThrow()
  })

  it('usa padrões quando não há arquivo', async () => {
    expect(await repository.loadSettings()).toMatchObject({ siteId: 1, profile: { behaviorId: 'real-equipment' } })
    expect(await repository.loadEvents()).toBeNull()
  })
})
