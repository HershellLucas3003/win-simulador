import { DEFAULT_CAMERA_SETTINGS } from '../../src/shared/camera'
import type { CameraSettings } from '../../src/shared/camera'
import { CameraService } from '../../src/server/camera/CameraService'
import type { CameraStorage, UploadFile } from '../../src/server/camera/CameraStorage'
import { timingStrategyFor } from '../../src/server/camera/CameraTiming'
import { captureNames } from '../../src/server/camera/ImageNaming'
import { defaultEventConfig } from '../../src/server/generation/eventDefaults'
import { seededRandom } from '../../src/server/generation/random'
import { VehicleGenerator } from '../../src/server/generation/VehicleGenerator'
import { MemoryTraffic } from '../helpers/equipmentHarness'
import { clientCatalog, plateCatalog } from '../helpers/catalog'

const capturedAt = new Date(2026, 8, 9, 13, 22, 29, 659)

describe('ImageNaming', () => {
  it('gera o mesmo nome visto no FTP do cliente', () => {
    expect(captureNames({ rootDir: 'WIM', siteId: 1, capturedAt, plate: '0ND668J', escape: false, noPlateNaming: 'unknown' })).toEqual({
      directory: 'WIM/WIM_01/20260909',
      vehicleFile: 'WIM_01_20260909132229659_0ND668J.jpg',
      plateFile: 'PlateWIM_01_20260909132229659_0ND668J.jpg',
    })
  })

  it('fuga vai para a pasta _ESCAPE', () => {
    expect(captureNames({ rootDir: 'WIM', siteId: 3, capturedAt, plate: 'ABC', escape: true, noPlateNaming: 'unknown' }).directory).toBe(
      'WIM/WIM_03_ESCAPE/20260909',
    )
  })

  it('sem placa não gera imagem de placa e usa os dois sufixos que o FtpImageResolver reconhece', () => {
    const unknown = captureNames({ rootDir: 'WIM', siteId: 1, capturedAt, plate: null, escape: false, noPlateNaming: 'unknown' })
    const empty = captureNames({ rootDir: 'WIM', siteId: 1, capturedAt, plate: null, escape: false, noPlateNaming: 'empty' })
    expect(unknown).toMatchObject({ vehicleFile: 'WIM_01_20260909132229659_unknown.jpg', plateFile: null })
    expect(empty.vehicleFile.split('_').pop()).toBe('.jpg')
  })
})

describe('CameraTiming', () => {
  const run = (mode: CameraSettings['timingMode']) => {
    const order: string[] = []
    const deferred: number[] = []
    timingStrategyFor(mode).run(
      { enqueueFrame: () => order.push('frame'), captureImages: async () => void order.push('camera') },
      1500,
      (delayMs, task) => {
        deferred.push(delayMs)
        task()
      },
    )
    return { order, deferred }
  }

  it('antes do frame: sobe a imagem e só depois enfileira', () => {
    expect(run('before-frame')).toEqual({ order: ['camera', 'frame'], deferred: [1500] })
  })

  it('depois do frame: enfileira e sobe a imagem com atraso', () => {
    expect(run('after-frame')).toEqual({ order: ['frame', 'camera'], deferred: [1500] })
  })

  it('sem imagem: só enfileira', () => {
    expect(run('none')).toEqual({ order: ['frame'], deferred: [] })
  })
})

class MemoryStorage implements CameraStorage {
  readonly uploads: { directory: string; files: UploadFile[] }[] = []
  fail = false

  async upload(directory: string, files: UploadFile[]) {
    if (this.fail) throw new Error('550 sem permissão')
    this.uploads.push({ directory, files })
  }
  async test() {}
  async close() {}
  isConnected() {
    return true
  }
}

describe('CameraService', () => {
  const catalog = clientCatalog()
  const plates = plateCatalog()
  const draft = new VehicleGenerator(catalog, plates, seededRandom(4)).generate({
    ...defaultEventConfig(catalog, 'e', 'x', 75),
    differentPlateChance: { percent: 0, always: true, alwaysValue: true },
  })

  const setup = (overrides: Partial<CameraSettings> = {}) => {
    const storage = new MemoryStorage()
    const traffic = new MemoryTraffic()
    const settings = { ...DEFAULT_CAMERA_SETTINGS, enabled: true, ...overrides }
    const service = new CameraService({
      storage,
      plates,
      traffic,
      random: seededRandom(1),
      clock: { now: () => capturedAt.getTime() },
      settings: () => settings,
      siteId: () => 1,
    })
    return { storage, traffic, service }
  }

  it('envia imagem da placa e do veículo com as imagens reais da pasta da classe', async () => {
    const { storage, service } = setup()
    await service.capture(draft, false)
    const [upload] = storage.uploads
    expect(upload.directory).toBe('WIM/WIM_01/20260909')
    expect(upload.files.map((file) => file.remoteName)).toEqual([`PlateWIM_01_20260909132229659_${draft.plate}.jpg`, `WIM_01_20260909132229659_${draft.plate}.jpg`])
    expect(upload.files[1].localPath).toContain(`${draft.plate}.jpg`)
  })

  it('fuga usa a placa lida errada e a pasta _ESCAPE', async () => {
    const { storage, service } = setup()
    await service.capture(draft, true)
    expect(storage.uploads[0].directory).toBe('WIM/WIM_01_ESCAPE/20260909')
    expect(storage.uploads[0].files[1].remoteName).toContain(draft.escapePlate!)
  })

  it('aplica o desvio de relógio da câmera no nome do arquivo', async () => {
    const { storage, service } = setup({ clockOffsetMs: 60000 })
    await service.capture(draft, false)
    expect(storage.uploads[0].files[1].remoteName).toContain('20260909132329659')
  })

  it('não envia nada desligada ou com fuga desabilitada', async () => {
    const off = setup({ enabled: false })
    await off.service.capture(draft, false)
    const noEscape = setup({ uploadEscape: false })
    await noEscape.service.capture(draft, true)
    expect(off.storage.uploads).toHaveLength(0)
    expect(noEscape.storage.uploads).toHaveLength(0)
  })

  it('falha no FTP não propaga e fica registrada no status', async () => {
    const { storage, service, traffic } = setup()
    storage.fail = true
    await expect(service.capture(draft, false)).resolves.toBeUndefined()
    expect(service.currentStatus()).toMatchObject({ failures: 1, lastError: '550 sem permissão' })
    expect(traffic.entries.at(-1)?.kind).toBe('error')
  })

  it('chance de placa ausente gera só a imagem do veículo', async () => {
    const { storage, service } = setup({ missingPlateChance: 100 })
    await service.capture(draft, false)
    expect(storage.uploads[0].files.map((file) => file.remoteName)).toEqual(['WIM_01_20260909132229659_unknown.jpg'])
  })
})
