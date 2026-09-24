import type { QueuedFrameView } from '../../shared/equipment'
import { Signal } from '../events'
import { buildDataFrame } from '../protocol/frameEncoder'

export interface QueuedFrame extends QueuedFrameView {
  payload: Buffer
}

export type NewQueuedFrame = Omit<QueuedFrame, 'id' | 'sendCount' | 'awaitingAck'>

export class FrameQueue {
  readonly changed = new Signal<QueuedFrameView[]>()
  private readonly items: QueuedFrame[] = []
  private nextId = 1

  enqueue(frame: NewQueuedFrame): QueuedFrame {
    const item: QueuedFrame = { ...frame, id: String(this.nextId++), sendCount: 0, awaitingAck: false }
    this.items.push(item)
    this.notify()
    return item
  }

  head(): QueuedFrame | undefined {
    return this.items[0]
  }

  headFrame(): Buffer | null {
    const head = this.head()
    return head ? buildDataFrame(head.payload) : null
  }

  markSent(): void {
    const head = this.head()
    if (!head) return
    head.sendCount += 1
    head.awaitingAck = true
    this.notify()
  }

  clearAwaiting(): void {
    const head = this.head()
    if (!head || !head.awaitingAck) return
    head.awaitingAck = false
    this.notify()
  }

  acknowledgeHead(): QueuedFrame | undefined {
    const head = this.head()
    if (!head || !head.awaitingAck) return undefined
    this.items.shift()
    this.notify()
    return head
  }

  remove(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id)
    if (index < 0) return false
    this.items.splice(index, 1)
    this.notify()
    return true
  }

  clear(): void {
    this.items.length = 0
    this.notify()
  }

  size(): number {
    return this.items.length
  }

  views(): QueuedFrameView[] {
    return this.items.map(({ payload: _payload, ...view }) => view)
  }

  private notify() {
    this.changed.emit(this.views())
  }
}
