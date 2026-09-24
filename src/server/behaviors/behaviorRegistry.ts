import type { BehaviorDescriptor, ResponseProfile } from '../../shared/scenario'
import type { BehaviorDefinition, ResponseBehavior } from './ResponseBehavior'
import { resolveParams } from './ResponseBehavior'
import { chunkedDefinition } from './ChunkedBehavior'
import { corruptBytesDefinition } from './CorruptBytesBehavior'
import { fullFrameDefinition } from './FullFrameBehavior'
import { garbagePrefixDefinition } from './GarbagePrefixBehavior'
import { invalidHeaderDefinition } from './InvalidHeaderBehavior'
import { misalignedDefinition } from './MisalignedBehavior'
import { muteDefinition } from './MuteBehavior'
import { realEquipmentDefinition } from './RealEquipmentBehavior'

const DEFINITIONS: BehaviorDefinition[] = [
  realEquipmentDefinition,
  fullFrameDefinition,
  chunkedDefinition,
  muteDefinition,
  invalidHeaderDefinition,
  garbagePrefixDefinition,
  misalignedDefinition,
  corruptBytesDefinition,
]

const BY_ID = new Map(DEFINITIONS.map((definition) => [definition.descriptor.id, definition]))

const definitionFor = (id: string) => BY_ID.get(id) ?? realEquipmentDefinition

export function listBehaviors(): BehaviorDescriptor[] {
  return DEFINITIONS.map((definition) => definition.descriptor)
}

export function createBehavior(profile: ResponseProfile): ResponseBehavior {
  const definition = definitionFor(profile.behaviorId)
  return definition.create(resolveParams(definition.descriptor, profile.params))
}

export function normalizeProfile(profile: ResponseProfile): ResponseProfile {
  const definition = definitionFor(profile.behaviorId)
  return {
    ...profile,
    behaviorId: definition.descriptor.id,
    params: resolveParams(definition.descriptor, profile.params),
    ackMode: profile.ackMode === 'ignore' ? 'ignore' : 'honor',
    responseDelayMs: clampMs(profile.responseDelayMs),
    jitterMs: clampMs(profile.jitterMs),
  }
}

const MAX_DELAY_MS = 30000

function clampMs(value: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), MAX_DELAY_MS) : 0
}
