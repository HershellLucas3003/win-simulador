import { FULL_FRAME_SIZE, HEADER_SIZE, REAL_EQUIPMENT_FRAME_SIZE } from '../protocol/constants'
import { randomInt } from '../generation/random'
import type { BehaviorDefinition, BehaviorParams, ResponseBehavior, ResponseInput, ResponsePlan } from './ResponseBehavior'
import { dataPlan, emptyPlan, realEquipmentChunks } from './planHelpers'

class CorruptBytesBehavior implements ResponseBehavior {
  constructor(private readonly params: BehaviorParams) {}

  respond({ pendingFrame, random }: ResponseInput): ResponsePlan {
    if (!pendingFrame) return emptyPlan()
    const frame = Buffer.from(pendingFrame)
    const lastIndex = Math.min(this.params.frameSize, frame.length) - 1
    for (let flip = 0; flip < this.params.count; flip += 1) {
      const index = randomInt(random, HEADER_SIZE, lastIndex)
      frame[index] = frame[index] ^ randomInt(random, 1, 255)
    }
    return dataPlan(realEquipmentChunks(frame, this.params.frameSize))
  }
}

export const corruptBytesDefinition: BehaviorDefinition = {
  descriptor: {
    id: 'corrupt-bytes',
    label: 'Bytes corrompidos',
    description: 'Altera bytes aleatórios do payload, mantendo o cabeçalho válido.',
    params: [
      { key: 'count', label: 'Bytes alterados', unit: 'bytes', min: 1, max: 64, defaultValue: 2 },
      { key: 'frameSize', label: 'Bytes enviados', unit: 'bytes', min: 3, max: FULL_FRAME_SIZE, defaultValue: REAL_EQUIPMENT_FRAME_SIZE },
    ],
  },
  create: (params) => new CorruptBytesBehavior(params),
}
