export type AckMode = 'honor' | 'ignore'

export interface ResponseProfile {
  behaviorId: string
  params: Record<string, number>
  ackMode: AckMode
  responseDelayMs: number
  jitterMs: number
}

export interface BehaviorParamDescriptor {
  key: string
  label: string
  unit: string
  min: number
  max: number
  defaultValue: number
}

export interface BehaviorDescriptor {
  id: string
  label: string
  description: string
  params: BehaviorParamDescriptor[]
}

export const DEFAULT_RESPONSE_PROFILE: ResponseProfile = {
  behaviorId: 'real-equipment',
  params: {},
  ackMode: 'honor',
  responseDelayMs: 2,
  jitterMs: 0,
}
