import type { EquipmentStats } from '../../shared/equipment'
import { EMPTY_STATS } from '../../shared/equipment'
import type { ResponseProfile } from '../../shared/scenario'
import { createBehavior } from '../behaviors/behaviorRegistry'
import type { ResponseBehavior, ResponsePlan } from '../behaviors/ResponseBehavior'
import type { Sleeper } from '../events'
import { Signal } from '../events'
import type { RandomSource } from '../generation/random'
import { randomInt } from '../generation/random'
import type { TrafficSink } from '../logging/TrafficLogger'
import { ACK_BYTE, POLL_BYTE } from '../protocol/constants'
import type { ByteChannel } from '../transport/Transport'
import type { FrameQueue, QueuedFrame } from './FrameQueue'

export interface EquipmentControllerDeps {
  queue: FrameQueue
  traffic: TrafficSink
  sleep: Sleeper
  random: RandomSource
  profile: ResponseProfile
}

export class EquipmentController {
  readonly statsChanged = new Signal<EquipmentStats>()
  readonly delivered = new Signal<QueuedFrame>()
  private channel: ByteChannel | null = null
  private profile: ResponseProfile
  private behavior: ResponseBehavior
  private stats: EquipmentStats = { ...EMPTY_STATS }
  private work: Promise<void> = Promise.resolve()

  constructor(private readonly deps: EquipmentControllerDeps) {
    this.profile = deps.profile
    this.behavior = createBehavior(deps.profile)
  }

  attach(channel: ByteChannel | null): void {
    this.channel = channel
    this.deps.queue.clearAwaiting()
  }

  setProfile(profile: ResponseProfile): void {
    this.profile = profile
    this.behavior = createBehavior(profile)
  }

  currentProfile(): ResponseProfile {
    return this.profile
  }

  currentStats(): EquipmentStats {
    return { ...this.stats }
  }

  resetStats(): void {
    this.stats = { ...EMPTY_STATS }
    this.statsChanged.emit(this.currentStats())
  }

  receive(bytes: Buffer): Promise<void> {
    const snapshot = Buffer.from(bytes)
    this.work = this.work.then(() => this.process(snapshot)).catch((error: unknown) => {
      this.deps.traffic.log('error', `Falha ao processar bytes recebidos: ${String(error)}`)
    })
    return this.work
  }

  idle(): Promise<void> {
    return this.work
  }

  private async process(bytes: Buffer) {
    for (const byte of bytes) {
      if (byte === POLL_BYTE) await this.handlePoll()
      else if (byte === ACK_BYTE) this.handleAck()
      else this.handleUnknown(byte)
    }
    this.statsChanged.emit(this.currentStats())
  }

  private async handlePoll() {
    this.stats.polls += 1
    const head = this.deps.queue.head()
    this.deps.traffic.log('rx', head ? `Poll recebido, frame serial ${head.serial} na fila` : 'Poll recebido', Buffer.from([POLL_BYTE]), !head)

    const plan = this.behavior.respond({ pendingFrame: this.deps.queue.headFrame(), random: this.deps.random })
    if (plan.deliversData) {
      this.stats.dataResponses += 1
      this.deps.queue.markSent()
    } else if (plan.chunks.length > 0) {
      this.stats.emptyResponses += 1
    }

    await this.transmit(plan, head)
  }

  private async transmit(plan: ResponsePlan, head: QueuedFrame | undefined) {
    const baseDelay = this.profile.responseDelayMs + randomInt(this.deps.random, 0, this.profile.jitterMs)
    for (const [index, chunk] of plan.chunks.entries()) {
      await this.deps.sleep((index === 0 ? baseDelay : 0) + chunk.delayMs)
      const channel = this.channel
      if (!channel || !channel.isOpen()) {
        this.deps.traffic.log('warn', 'Porta fechada durante a resposta, envio abortado')
        return
      }
      await channel.write(chunk.bytes)
      this.deps.traffic.log('tx', this.describeChunk(plan, index, head), chunk.bytes, !plan.deliversData)
    }
  }

  private describeChunk(plan: ResponsePlan, index: number, head: QueuedFrame | undefined): string {
    if (!plan.deliversData) return 'Sem dado'
    const part = plan.chunks.length > 1 ? ` (parte ${index + 1}/${plan.chunks.length})` : ''
    return `Frame serial ${head?.serial ?? '?'} envio ${head?.sendCount ?? 0}${part}`
  }

  private handleAck() {
    const head = this.deps.queue.head()
    if (!head || !head.awaitingAck) {
      this.stats.unexpectedAcks += 1
      this.deps.traffic.log('warn', 'ACK recebido sem frame pendente', Buffer.from([ACK_BYTE]))
      return
    }
    if (this.profile.ackMode === 'ignore') {
      this.stats.ignoredAcks += 1
      this.deps.traffic.log('warn', `ACK ignorado de propósito, serial ${head.serial} será reenviado`, Buffer.from([ACK_BYTE]))
      return
    }
    this.stats.acks += 1
    const delivered = this.deps.queue.acknowledgeHead()
    if (!delivered) return
    this.stats.delivered += 1
    this.deps.traffic.log('rx', `ACK recebido, serial ${delivered.serial} entregue após ${delivered.sendCount} envio(s)`, Buffer.from([ACK_BYTE]))
    this.delivered.emit(delivered)
  }

  private handleUnknown(byte: number) {
    this.stats.unknownBytes += 1
    this.deps.traffic.log('warn', 'Byte desconhecido recebido', Buffer.from([byte]))
  }
}
