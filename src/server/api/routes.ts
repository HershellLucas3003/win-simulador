import type { FastifyInstance, FastifyReply } from 'fastify'
import type { EventConfig } from '../../shared/events'
import type { ResponseProfile } from '../../shared/scenario'
import type { CameraSettingsInput } from '../../shared/snapshot'
import type { SimulatorApp } from '../app/SimulatorApp'
import { ValidationError } from '../config/validators'

type IdParams = { Params: { id: string } }
type NameParams = { Params: { name: string } }

const MAX_REPLAY_BYTES = 30 * 1024 * 1024

export function registerErrorHandler(server: FastifyInstance) {
  server.setErrorHandler((error: unknown, _request, reply: FastifyReply) => {
    if (error instanceof ValidationError) {
      return reply.status(400).send({ error: 'validation', fields: error.fields })
    }
    const { statusCode, message } = error as { statusCode?: number; message?: string }
    const status = typeof statusCode === 'number' && statusCode < 500 ? statusCode : 500
    return reply.status(status).send({ error: 'failure', message: message ?? String(error) })
  })
}

export function registerRoutes(server: FastifyInstance, app: SimulatorApp) {
  server.get('/api/snapshot', async () => app.snapshot())
  server.get('/api/catalog', async () => app.catalogData())
  server.get('/api/traffic', async () => app.trafficHistory())

  server.get('/api/serial/ports', async () => app.listPorts())
  server.post<{ Body: { path: string } }>('/api/serial/open', async (request) => {
    await app.openPort(String(request.body?.path ?? ''))
    return app.snapshot().serial
  })
  server.post('/api/serial/close', async () => {
    await app.closePort()
    return app.snapshot().serial
  })

  server.put<{ Body: ResponseProfile }>('/api/profile', async (request) => {
    await app.setProfile(request.body)
    return app.snapshot().settings.profile
  })
  server.put<{ Body: { siteId: number; equipmentClockOffsetMs: number } }>('/api/equipment', async (request) => {
    await app.updateEquipment(Number(request.body?.siteId), Number(request.body?.equipmentClockOffsetMs))
    return app.snapshot().settings
  })
  server.put<{ Body: { nextSerial: number } }>('/api/equipment/serial', async (request) => {
    await app.setNextSerial(Number(request.body?.nextSerial))
    return { nextSerial: app.snapshot().nextSerial }
  })
  server.post('/api/equipment/stats/reset', async () => {
    app.resetStats()
    return { ok: true }
  })

  server.post('/api/events', async () => app.createEvent())
  server.put<IdParams & { Body: EventConfig }>('/api/events/:id', async (request) =>
    app.updateEvent({ ...request.body, id: request.params.id }),
  )
  server.delete<IdParams>('/api/events/:id', async (request) => {
    await app.deleteEvent(request.params.id)
    return { ok: true }
  })
  server.post<IdParams & { Body: { immediate?: boolean; presetId?: string | null } }>('/api/events/:id/emit', async (request) => {
    app.emitEvent(request.params.id, Boolean(request.body?.immediate), request.body?.presetId)
    return { ok: true }
  })
  server.post<IdParams & { Body: { count: number; spacingMs: number; presetId?: string | null } }>(
    '/api/events/:id/burst',
    async (request) => ({
      emitted: app.emitBurst(request.params.id, Number(request.body?.count), Number(request.body?.spacingMs), request.body?.presetId),
    }),
  )
  server.post<IdParams & { Body: { enabled: boolean } }>('/api/events/:id/auto', async (request) => {
    await app.setAutoEmit(request.params.id, Boolean(request.body?.enabled))
    return { ok: true }
  })
  server.post<{ Body: unknown }>('/api/events/import-rust', async (request) => ({
    imported: await app.importRustEvents(request.body),
  }))

  server.delete('/api/queue', async () => {
    app.clearQueue()
    return { ok: true }
  })
  server.delete<IdParams>('/api/queue/:id', async (request) => ({ removed: app.removeFromQueue(request.params.id) }))

  server.put<{ Body: CameraSettingsInput }>('/api/camera', async (request) => {
    await app.updateCamera(request.body)
    return app.snapshot().camera
  })
  server.post('/api/camera/test', async () => {
    await app.testCamera()
    return { ok: true }
  })

  server.post<{ Body: { text: string } }>('/api/replay/parse', { bodyLimit: MAX_REPLAY_BYTES }, async (request) =>
    app.parseReplay(String(request.body?.text ?? '')),
  )
  server.post<{ Body: { indexes: number[] } }>('/api/replay/enqueue', async (request) => ({
    enqueued: app.enqueueReplay(Array.isArray(request.body?.indexes) ? request.body.indexes.map(Number) : []),
  }))

  server.get('/api/scenarios', async () => app.listScenarios())
  server.post<{ Body: { name: string } }>('/api/scenarios', async (request) => {
    await app.saveScenario(String(request.body?.name ?? ''))
    return app.listScenarios()
  })
  server.post<NameParams>('/api/scenarios/:name/load', async (request) => {
    await app.loadScenario(request.params.name)
    return app.snapshot()
  })
  server.delete<NameParams>('/api/scenarios/:name', async (request) => {
    await app.deleteScenario(request.params.name)
    return app.listScenarios()
  })
}
