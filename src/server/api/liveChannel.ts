import type { FastifyInstance } from 'fastify'
import type { TrafficEntry } from '../../shared/equipment'
import type { ServerMessage } from '../../shared/snapshot'
import type { SimulatorApp } from '../app/SimulatorApp'

const TRAFFIC_FLUSH_MS = 150

interface LiveSocket {
  readyState: number
  send(data: string): void
  on(event: 'close', listener: () => void): void
}

const OPEN = 1

export function registerLiveChannel(server: FastifyInstance, app: SimulatorApp) {
  const sockets = new Set<LiveSocket>()
  let pendingTraffic: TrafficEntry[] = []

  const broadcast = (message: ServerMessage) => {
    const payload = JSON.stringify(message)
    sockets.forEach((socket) => {
      if (socket.readyState === OPEN) socket.send(payload)
    })
  }

  app.snapshotChanged.subscribe((data) => broadcast({ type: 'snapshot', data }))
  app.vehiclesChanged.subscribe((data) => broadcast({ type: 'vehicles', data }))
  app.trafficAdded.subscribe((entry) => pendingTraffic.push(entry))

  const flush = setInterval(() => {
    if (pendingTraffic.length === 0) return
    const data = pendingTraffic
    pendingTraffic = []
    broadcast({ type: 'traffic', data })
  }, TRAFFIC_FLUSH_MS)
  server.addHook('onClose', async () => clearInterval(flush))

  server.get('/ws', { websocket: true }, (socket: LiveSocket) => {
    sockets.add(socket)
    socket.send(JSON.stringify({ type: 'snapshot', data: app.snapshot() } satisfies ServerMessage))
    socket.send(JSON.stringify({ type: 'traffic-history', data: app.trafficHistory() } satisfies ServerMessage))
    socket.on('close', () => sockets.delete(socket))
  })
}
