import type { BehaviorDescriptor } from '../../shared/scenario'
import type { RandomSource } from '../generation/random'

export interface ResponseChunk {
  bytes: Buffer
  delayMs: number
}

export interface ResponsePlan {
  chunks: ResponseChunk[]
  deliversData: boolean
}

export interface ResponseInput {
  pendingFrame: Buffer | null
  random: RandomSource
}

export interface ResponseBehavior {
  respond(input: ResponseInput): ResponsePlan
}

export type BehaviorParams = Record<string, number>

export interface BehaviorDefinition {
  descriptor: BehaviorDescriptor
  create(params: BehaviorParams): ResponseBehavior
}

export function resolveParams(descriptor: BehaviorDescriptor, params: BehaviorParams): BehaviorParams {
  return Object.fromEntries(
    descriptor.params.map((param) => {
      const raw = params[param.key]
      const value = Number.isFinite(raw) ? raw : param.defaultValue
      return [param.key, Math.min(Math.max(Math.round(value), param.min), param.max)]
    }),
  )
}
