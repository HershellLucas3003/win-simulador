import type { RandomChance, RandomRange } from '../../shared/events'
import type { RandomSource } from './random'
import { randomInt } from './random'

export function sampleRange(range: RandomRange, random: RandomSource): number {
  if (range.random && range.min !== range.max) return randomInt(random, range.min, range.max)
  return range.max
}

export function sampleChance(chance: RandomChance, random: RandomSource): boolean {
  if (chance.always) return chance.alwaysValue
  return random.next() * 100 < chance.percent
}

export const range = (min: number, max: number, random = true): RandomRange => ({ min, max, random })

export const chance = (percent: number, always = false, alwaysValue = true): RandomChance => ({ percent, always, alwaysValue })
