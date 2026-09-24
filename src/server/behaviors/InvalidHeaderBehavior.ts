import { FULL_FRAME_SIZE, HEADER_START, REAL_EQUIPMENT_FRAME_SIZE } from '../protocol/constants'
import type { BehaviorDefinition, BehaviorParams, ResponseBehavior, ResponseInput, ResponsePlan } from './ResponseBehavior'
import { dataPlan, emptyPlan, realEquipmentChunks } from './planHelpers'

class InvalidHeaderBehavior implements ResponseBehavior {
  constructor(private readonly params: BehaviorParams) {}

  respond({ pendingFrame }: ResponseInput): ResponsePlan {
    if (!pendingFrame) return emptyPlan()
    const frame = Buffer.from(pendingFrame)
    frame[0] = HEADER_START
    frame[1] = this.params.secondByte
    return dataPlan(realEquipmentChunks(frame, this.params.frameSize))
  }
}

export const invalidHeaderDefinition: BehaviorDefinition = {
  descriptor: {
    id: 'invalid-header',
    label: 'Cabeçalho inválido',
    description: 'Troca o segundo byte do cabeçalho (0x06) por outro valor. O serviço deve descartar o frame.',
    params: [
      { key: 'secondByte', label: 'Segundo byte', unit: 'dec', min: 0, max: 255, defaultValue: 7 },
      { key: 'frameSize', label: 'Bytes enviados', unit: 'bytes', min: 2, max: FULL_FRAME_SIZE, defaultValue: REAL_EQUIPMENT_FRAME_SIZE },
    ],
  },
  create: (params) => new InvalidHeaderBehavior(params),
}
