import type { CameraSettings, CameraStatus } from '../../shared/camera'
import type { Clock } from '../events'
import { Signal } from '../events'
import type { PlateCatalog } from '../generation/PlateCatalog'
import type { RandomSource } from '../generation/random'
import type { VehicleDraft } from '../generation/VehicleDraft'
import type { TrafficSink } from '../logging/TrafficLogger'
import type { CameraStorage, UploadFile } from './CameraStorage'
import { captureNames } from './ImageNaming'

export interface CameraServiceDeps {
  storage: CameraStorage
  plates: PlateCatalog
  traffic: TrafficSink
  random: RandomSource
  clock: Clock
  settings: () => CameraSettings
  siteId: () => number
}

export class CameraService {
  readonly statusChanged = new Signal<CameraStatus>()
  private status: CameraStatus = { connected: false, lastError: null, uploads: 0, failures: 0, lastUpload: null }

  constructor(private readonly deps: CameraServiceDeps) {}

  currentStatus(): CameraStatus {
    return { ...this.status, connected: this.deps.storage.isConnected() }
  }

  isActiveFor(escape: boolean): boolean {
    const settings = this.deps.settings()
    return settings.enabled && (!escape || settings.uploadEscape)
  }

  async capture(draft: VehicleDraft, escape: boolean): Promise<void> {
    if (!this.isActiveFor(escape)) return
    const settings = this.deps.settings()
    const capturedAt = new Date(this.deps.clock.now() + settings.clockOffsetMs)
    const plateMissing = this.deps.random.next() * 100 < settings.missingPlateChance
    const recognizedPlate = escape ? draft.escapePlate ?? draft.plate : draft.plate
    const names = captureNames({
      rootDir: settings.rootDir,
      siteId: this.deps.siteId(),
      capturedAt,
      plate: plateMissing ? null : recognizedPlate,
      escape,
      noPlateNaming: settings.noPlateNaming,
    })

    const files: UploadFile[] = []
    if (names.plateFile) files.push({ localPath: this.deps.plates.plateImage(draft.imageFolder, draft.plate), remoteName: names.plateFile })
    files.push({ localPath: this.deps.plates.vehicleImage(draft.imageFolder, draft.plate), remoteName: names.vehicleFile })

    try {
      await this.deps.storage.upload(names.directory, files)
      this.update({ uploads: this.status.uploads + 1, lastUpload: `${names.directory}/${names.vehicleFile}`, lastError: null })
      this.deps.traffic.log('info', `Câmera: ${names.directory}/${names.vehicleFile}${names.plateFile ? ' + placa' : ' (sem placa)'}`)
    } catch (error) {
      const message = (error as Error).message
      this.update({ failures: this.status.failures + 1, lastError: message })
      this.deps.traffic.log('error', `Câmera: falha ao enviar ${names.vehicleFile}: ${message}`)
    }
  }

  async test(): Promise<void> {
    try {
      await this.deps.storage.test()
      this.update({ lastError: null })
    } catch (error) {
      this.update({ lastError: (error as Error).message })
      throw error
    }
  }

  private update(patch: Partial<CameraStatus>) {
    this.status = { ...this.status, ...patch }
    this.statusChanged.emit(this.currentStatus())
  }
}
