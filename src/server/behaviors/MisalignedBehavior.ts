import { FULL_FRAME_SIZE, HEADER_SIZE, REAL_EQUIPMENT_FRAME_SIZE } from '../protocol/constants'
import type { BehaviorDefinition, BehaviorParams, ResponseBehavior, ResponseInput, ResponsePlan } from './ResponseBehavior'
import { dataPlan, emptyPlan, realEquipmentChunks } from './planHelpers'

class MisalignedBehavior implements ResponseBehavior {
  constructor(private readonly params: BehaviorParams) {}

  respond({ pendingFrame }: ResponseInput): ResponsePlan {
    if (!pendingFrame) return emptyPlan()
    const header = pendingFrame.subarray(0, HEADER_SIZE)
    const shifted = pendingFrame.subarray(HEADER_SIZE + this.params.lostBytes)
    const frame = Buffer.concat([header, shifted, Buffer.alloc(this.params.lostBytes)])
    return dataPlan(realEquipmentChunks(frame, this.params.frameSize))
  }
}

export const misalignedDefinition: BehaviorDefinition = {
  descriptor: {
    id: 'misaligned',
    label: 'Frame desalinhado',
    description: 'Perde bytes logo após o cabeçalho. Gera valores absurdos como os vistos no wim_vbv (axlNumber 5631, classeIndex 20992).',
    params: [
      { key: 'lostBytes', label: 'Bytes perdidos', unit: 'bytes', min: 1, max: 64, defaultValue: 1 },
      { key: 'frameSize', label: 'Bytes enviados', unit: 'bytes', min: 2, max: FULL_FRAME_SIZE, defaultValue: REAL_EQUIPMENT_FRAME_SIZE },
    ],
  },
  create: (params) => new MisalignedBehavior(params),
}
