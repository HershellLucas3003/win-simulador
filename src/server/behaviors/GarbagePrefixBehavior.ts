import { FULL_FRAME_SIZE, REAL_EQUIPMENT_FRAME_SIZE } from '../protocol/constants'
import { randomBytes } from '../generation/random'
import type { BehaviorDefinition, BehaviorParams, ResponseBehavior, ResponseInput, ResponsePlan } from './ResponseBehavior'
import { emptyPlan, realEquipmentChunks } from './planHelpers'

class GarbagePrefixBehavior implements ResponseBehavior {
  constructor(private readonly params: BehaviorParams) {}

  respond({ pendingFrame, random }: ResponseInput): ResponsePlan {
    const garbage = { bytes: randomBytes(random, this.params.count), delayMs: 0 }
    if (!pendingFrame) {
      const empty = emptyPlan()
      return { ...empty, chunks: [garbage, ...empty.chunks] }
    }
    return { chunks: [garbage, ...realEquipmentChunks(pendingFrame, this.params.frameSize)], deliversData: true }
  }
}

export const garbagePrefixDefinition: BehaviorDefinition = {
  descriptor: {
    id: 'garbage-prefix',
    label: 'Lixo na linha',
    description: 'Envia bytes aleatórios antes de cada resposta, simulando ruído na serial.',
    params: [
      { key: 'count', label: 'Bytes de lixo', unit: 'bytes', min: 1, max: 64, defaultValue: 3 },
      { key: 'frameSize', label: 'Bytes enviados', unit: 'bytes', min: 2, max: FULL_FRAME_SIZE, defaultValue: REAL_EQUIPMENT_FRAME_SIZE },
    ],
  },
  create: (params) => new GarbagePrefixBehavior(params),
}
