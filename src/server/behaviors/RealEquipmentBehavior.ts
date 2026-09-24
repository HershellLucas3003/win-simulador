import { FULL_FRAME_SIZE, REAL_EQUIPMENT_FRAME_SIZE } from '../protocol/constants'
import type { BehaviorDefinition, BehaviorParams, ResponseBehavior, ResponseInput, ResponsePlan } from './ResponseBehavior'
import { dataPlan, emptyPlan, realEquipmentChunks } from './planHelpers'

class RealEquipmentBehavior implements ResponseBehavior {
  constructor(private readonly params: BehaviorParams) {}

  respond({ pendingFrame }: ResponseInput): ResponsePlan {
    if (!pendingFrame) return emptyPlan()
    return dataPlan(realEquipmentChunks(pendingFrame, this.params.frameSize, this.params.bodyDelayMs))
  }
}

export const realEquipmentDefinition: BehaviorDefinition = {
  descriptor: {
    id: 'real-equipment',
    label: 'Equipamento real',
    description: 'Igual ao controlador do cliente: cabeçalho e corpo em dois pedaços, parando em 240 bytes.',
    params: [
      { key: 'frameSize', label: 'Bytes enviados', unit: 'bytes', min: 2, max: FULL_FRAME_SIZE, defaultValue: REAL_EQUIPMENT_FRAME_SIZE },
      { key: 'bodyDelayMs', label: 'Atraso do corpo', unit: 'ms', min: 0, max: 2000, defaultValue: 4 },
    ],
  },
  create: (params) => new RealEquipmentBehavior(params),
}
