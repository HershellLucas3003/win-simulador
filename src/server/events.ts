export type Listener<T> = (value: T) => void

export class Signal<T> {
  private readonly listeners = new Set<Listener<T>>()

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit(value: T) {
    this.listeners.forEach((listener) => listener(value))
  }
}

export interface Clock {
  now(): number
}

export const systemClock: Clock = { now: () => Date.now() }

export type Sleeper = (ms: number) => Promise<void>

export const realSleep: Sleeper = (ms) => (ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms)))
