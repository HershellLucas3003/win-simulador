import type { BehaviorDefinition, ResponseBehavior, ResponsePlan } from './ResponseBehavior'

class MuteBehavior implements ResponseBehavior {
  respond(): ResponsePlan {
    return { chunks: [], deliversData: false }
  }
}

export const muteDefinition: BehaviorDefinition = {
  descriptor: {
    id: 'mute',
    label: 'Equipamento mudo',
    description: 'Recebe o poll e não responde nada, como controlador travado.',
    params: [],
  },
  create: () => new MuteBehavior(),
}
