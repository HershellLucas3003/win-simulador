export interface RandomSource {
  next(): number
}

export const systemRandom: RandomSource = { next: () => Math.random() }

export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0
      let t = state
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
  }
}

export function randomInt(random: RandomSource, min: number, max: number): number {
  const low = Math.min(min, max)
  const high = Math.max(min, max)
  return low + Math.floor(random.next() * (high - low + 1))
}

export function pickOne<T>(random: RandomSource, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(random.next() * items.length)]
}

export function pickWeighted<T>(random: RandomSource, items: readonly T[], weightOf: (item: T) => number): T | undefined {
  const total = items.reduce((sum, item) => sum + Math.max(weightOf(item), 0), 0)
  if (total <= 0) return pickOne(random, items)
  let cursor = random.next() * total
  for (const item of items) {
    cursor -= Math.max(weightOf(item), 0)
    if (cursor < 0) return item
  }
  return items[items.length - 1]
}

export function randomBytes(random: RandomSource, count: number): Buffer {
  return Buffer.from(Array.from({ length: count }, () => randomInt(random, 0, 255)))
}
