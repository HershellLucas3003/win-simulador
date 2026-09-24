import { FULL_FRAME_SIZE, REAL_EQUIPMENT_FRAME_SIZE } from '../protocol/constants'
import type { BehaviorDefinition, BehaviorParams, ResponseBehavior, ResponseInput, ResponsePlan } from './ResponseBehavior'
import { dataPlan, emptyPlan, splitBySize } from './planHelpers'

class ChunkedBehavior implements ResponseBehavior {
  constructor(private readonly params: BehaviorParams) {}

  respond({ pendingFrame }: ResponseInput): ResponsePlan {
    if (!pendingFrame) return emptyPlan()
    const sent = pendingFrame.subarray(0, this.params.frameSize)
    return dataPlan(splitBySize(sent, this.params.chunkSize, this.params.delayMs))
  }
}

export const chunkedDefinition: BehaviorDefinition = {
  descriptor: {
    id: 'chunked',
    label: 'Frame picado',
    description: 'Divide o frame em pedaços com atraso entre eles. Acima de ~450 ms sem dado o Main.java completa o frame com zero.',
    params: [
      { key: 'frameSize', label: 'Bytes enviados', unit: 'bytes', min: 2, max: FULL_FRAME_SIZE, defaultValue: REAL_EQUIPMENT_FRAME_SIZE },
      { key: 'chunkSize', label: 'Tamanho do pedaço', unit: 'bytes', min: 1, max: FULL_FRAME_SIZE, defaultValue: 32 },
      { key: 'delayMs', label: 'Atraso entre pedaços', unit: 'ms', min: 0, max: 5000, defaultValue: 60 },
    ],
  },
  create: (params) => new ChunkedBehavior(params),
}
