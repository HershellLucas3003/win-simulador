import type { BehaviorDefinition, ResponseBehavior, ResponseInput, ResponsePlan } from './ResponseBehavior'
import { dataPlan, emptyPlan } from './planHelpers'

class FullFrameBehavior implements ResponseBehavior {
  respond({ pendingFrame }: ResponseInput): ResponsePlan {
    if (!pendingFrame) return emptyPlan()
    return dataPlan([{ bytes: pendingFrame, delayMs: 0 }])
  }
}

export const fullFrameDefinition: BehaviorDefinition = {
  descriptor: {
    id: 'full-frame',
    label: 'Frame completo (330)',
    description: 'Envia os 330 bytes de uma vez, como a especificação do protocolo prevê.',
    params: [],
  },
  create: () => new FullFrameBehavior(),
}
