import type { Clock } from '../events'

export class OffsetClock {
  constructor(private readonly base: Clock, private offsetMs = 0) {}

  now(): Date {
    return new Date(this.base.now() + this.offsetMs)
  }

  setOffset(offsetMs: number): void {
    this.offsetMs = Number.isFinite(offsetMs) ? Math.round(offsetMs) : 0
  }

  offset(): number {
    return this.offsetMs
  }
}
