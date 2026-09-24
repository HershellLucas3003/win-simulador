import type { CameraSettings } from '../../shared/camera'
import type { FrameSource } from '../../shared/equipment'
import type { ReplayFrameView } from '../../shared/replay'
import type { CameraService } from '../camera/CameraService'
import type { Deferrer } from '../camera/CameraTiming'
import { timingStrategyFor } from '../camera/CameraTiming'
import type { FrameQueue } from '../equipment/FrameQueue'
import type { FrameStamper } from '../equipment/FrameStamper'
import type { VehicleDraft } from '../generation/VehicleDraft'
import type { TrafficSink } from '../logging/TrafficLogger'
import { encodePayload } from '../protocol/frameEncoder'
import type { ActiveVehicle } from '../scheduler/EventScheduler'

export interface VehiclePipelineDeps {
  queue: FrameQueue
  stamper: FrameStamper
  camera: CameraService
  traffic: TrafficSink
  defer: Deferrer
  cameraSettings: () => CameraSettings
}

export class VehiclePipeline {
  constructor(private readonly deps: VehiclePipelineDeps) {}

  handleAppear(vehicle: ActiveVehicle, source: FrameSource = 'generated'): void {
    const settings = this.deps.cameraSettings()
    const mode = this.deps.camera.isActiveFor(false) ? settings.timingMode : 'none'
    timingStrategyFor(mode).run(
      {
        enqueueFrame: () => this.enqueueDraft(vehicle.draft, source),
        captureImages: () => this.deps.camera.capture(vehicle.draft, false),
      },
      settings.delayMs,
      this.deps.defer,
    )
  }

  handleEscape(vehicle: ActiveVehicle): void {
    this.deps.camera.capture(vehicle.draft, true).catch(() => undefined)
  }

  enqueueReplay(payload: Buffer, view: ReplayFrameView): void {
    this.deps.queue.enqueue({
      payload,
      serial: view.serial,
      classIndex: view.classIndex,
      classCode: view.classCode,
      plate: '',
      numAxles: view.numAxles,
      gross: view.gross,
      speedKmh: view.speedKmh,
      source: 'replay',
      presetId: null,
      enqueuedAt: new Date().toISOString(),
    })
    this.deps.traffic.log('info', `Replay: frame serial ${view.serial} (linha ${view.line}) enfileirado`)
  }

  private enqueueDraft(draft: VehicleDraft, source: FrameSource) {
    try {
      const reading = this.deps.stamper.stamp(draft)
      const queued = this.deps.queue.enqueue({
        payload: encodePayload(reading),
        serial: reading.serial,
        classIndex: reading.classIndex,
        classCode: reading.classCode,
        plate: draft.plate,
        numAxles: reading.numAxles,
        gross: reading.gross,
        speedKmh: reading.speedKmh,
        source,
        presetId: draft.presetId,
        enqueuedAt: new Date().toISOString(),
      })
      this.deps.traffic.log('info', `Veículo ${draft.plate} (${draft.classLabel}, ${draft.numAxles} eixos, ${draft.gross} kg) na fila com serial ${queued.serial}`)
    } catch (error) {
      this.deps.traffic.log('error', `Não foi possível montar o frame de ${draft.plate}: ${(error as Error).message}`)
    }
  }
}
