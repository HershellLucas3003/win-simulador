const U32_RANGE = 0x100000000

export class SerialCounter {
  private value: number

  constructor(start: number) {
    this.value = SerialCounter.normalize(start)
  }

  next(): number {
    const current = this.value
    this.value = SerialCounter.normalize(current + 1)
    return current
  }

  peek(): number {
    return this.value
  }

  reset(start: number): void {
    this.value = SerialCounter.normalize(start)
  }

  private static normalize(value: number): number {
    const integer = Math.trunc(value)
    return ((integer % U32_RANGE) + U32_RANGE) % U32_RANGE
  }
}
