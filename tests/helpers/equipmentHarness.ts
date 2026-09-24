import type { TrafficKind } from '../../src/shared/equipment'
import type { ResponseProfile } from '../../src/shared/scenario'
import { DEFAULT_RESPONSE_PROFILE } from '../../src/shared/scenario'
import { EquipmentController } from '../../src/server/equipment/EquipmentController'
import { FrameQueue } from '../../src/server/equipment/FrameQueue'
import { seededRandom } from '../../src/server/generation/random'
import type { TrafficSink } from '../../src/server/logging/TrafficLogger'
import { encodePayload } from '../../src/server/protocol/frameEncoder'
import type { ByteChannel } from '../../src/server/transport/Transport'
import type { VehicleReading } from '../../src/shared/vehicle'
import { REAL_FRAMES } from '../fixtures/realFrames'

export class InMemoryChannel implements ByteChannel {
  readonly writes: Buffer[] = []
  open = true

  async write(bytes: Buffer): Promise<void> {
    this.writes.push(Buffer.from(bytes))
  }

  isOpen(): boolean {
    return this.open
  }

  take(): Buffer {
    const all = Buffer.concat(this.writes)
    this.writes.length = 0
    return all
  }
}

export class MemoryTraffic implements TrafficSink {
  readonly entries: { kind: TrafficKind; message: string }[] = []

  log(kind: TrafficKind, message: string): void {
    this.entries.push({ kind, message })
  }
}

export function createHarness(profile: Partial<ResponseProfile> = {}) {
  const queue = new FrameQueue()
  const channel = new InMemoryChannel()
  const traffic = new MemoryTraffic()
  const controller = new EquipmentController({
    queue,
    traffic,
    sleep: async () => undefined,
    random: seededRandom(42),
    profile: { ...DEFAULT_RESPONSE_PROFILE, responseDelayMs: 0, ...profile },
  })
  controller.attach(channel)

  const enqueue = (reading: VehicleReading = REAL_FRAMES[0].reading) =>
    queue.enqueue({
      payload: encodePayload(reading),
      serial: reading.serial,
      classIndex: reading.classIndex,
      classCode: reading.classCode,
      plate: 'TEST123',
      numAxles: reading.numAxles,
      gross: reading.gross,
      speedKmh: reading.speedKmh,
      source: 'manual',
      presetId: null,
      enqueuedAt: new Date().toISOString(),
    })

  return { queue, channel, traffic, controller, enqueue }
}
