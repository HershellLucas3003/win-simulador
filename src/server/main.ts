import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import Fastify from 'fastify'
import { registerLiveChannel } from './api/liveChannel'
import { registerErrorHandler, registerRoutes } from './api/routes'
import { SimulatorApp } from './app/SimulatorApp'
import { timerDeferrer } from './camera/CameraTiming'
import { JsonFileStore } from './config/JsonFileStore'
import { SimulatorRepository } from './config/SimulatorRepository'
import { realSleep, systemClock } from './events'
import { systemRandom } from './generation/random'
import { TrafficLogger } from './logging/TrafficLogger'
import { SerialPortTransport } from './transport/SerialPortTransport'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PORT = Number(process.env.SIMULATOR_PORT ?? 4580)
const HOST = process.env.SIMULATOR_HOST ?? '127.0.0.1'

async function main() {
  const traffic = new TrafficLogger(path.join(ROOT, 'logs'))
  const app = new SimulatorApp({
    repository: new SimulatorRepository(new JsonFileStore(path.join(ROOT, 'config'))),
    transport: new SerialPortTransport(),
    traffic,
    imageRoot: path.join(ROOT, 'assets', 'img'),
    clock: systemClock,
    random: systemRandom,
    sleep: realSleep,
    defer: timerDeferrer,
    listPorts: () => SerialPortTransport.list(),
  })
  await app.init()

  const server = Fastify({ logger: false, bodyLimit: 5 * 1024 * 1024 })
  await server.register(fastifyWebsocket)
  registerErrorHandler(server)
  registerRoutes(server, app)
  registerLiveChannel(server, app)

  const webDist = path.join(ROOT, 'dist', 'web')
  if (existsSync(webDist)) await server.register(fastifyStatic, { root: webDist })

  app.start()
  await server.listen({ port: PORT, host: HOST })
  traffic.log('info', `Simulador WIM ouvindo em http://${HOST}:${PORT}`)
  console.log(`Simulador WIM em http://${HOST}:${PORT}`)

  const shutdown = async () => {
    await app.stop()
    await server.close()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
