import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import bunyan from 'bunyan'
import { FtpSrv } from 'ftp-srv'
import { FtpCameraStorage } from '../../src/server/camera/FtpCameraStorage'
import { IMAGE_ROOT } from '../helpers/catalog'

const PORT = 2199

describe('FtpCameraStorage contra servidor FTP real', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'wim-ftp-'))
  let server: FtpSrv

  beforeAll(async () => {
    server = new FtpSrv({ url: `ftp://127.0.0.1:${PORT}`, pasv_url: '127.0.0.1', pasv_min: 2200, pasv_max: 2250, anonymous: false, log: bunyan.createLogger({ name: 'ftp-test', level: 'fatal' }) })
    server.on('login', ({ username, password }, resolve, reject) => {
      if (username === 'tracevia' && password === 'teste') resolve({ root })
      else reject(new Error('credencial inválida'))
    })
    await server.listen()
  })

  afterAll(async () => {
    await server.close()
    rmSync(root, { recursive: true, force: true })
  })

  it('cria a árvore WIM/WIM_01/<dia> e sobe placa e veículo', async () => {
    const storage = new FtpCameraStorage({ host: '127.0.0.1', port: PORT, user: 'tracevia', password: 'teste' })
    const vehicle = path.join(IMAGE_ROOT, 'vehicle', '1', 'KT79897.jpg')
    const plate = path.join(IMAGE_ROOT, 'plate', '1', 'KT79897.jpg')

    await storage.upload('WIM/WIM_01/20260909', [
      { localPath: plate, remoteName: 'PlateWIM_01_20260909132229659_KT79897.jpg' },
      { localPath: vehicle, remoteName: 'WIM_01_20260909132229659_KT79897.jpg' },
    ])
    await storage.upload('WIM/WIM_01/20260909', [{ localPath: vehicle, remoteName: 'WIM_01_20260909132300000_unknown.jpg' }])

    const day = path.join(root, 'WIM', 'WIM_01', '20260909')
    expect(readFileSync(path.join(day, 'WIM_01_20260909132229659_KT79897.jpg')).equals(readFileSync(vehicle))).toBe(true)
    expect(existsSync(path.join(day, 'PlateWIM_01_20260909132229659_KT79897.jpg'))).toBe(true)
    expect(existsSync(path.join(day, 'WIM_01_20260909132300000_unknown.jpg'))).toBe(true)
    expect(storage.isConnected()).toBe(true)
    await storage.close()
  })

  it('credencial errada rejeita e não deixa conexão pendurada', async () => {
    const storage = new FtpCameraStorage({ host: '127.0.0.1', port: PORT, user: 'tracevia', password: 'errada' })
    await expect(storage.test()).rejects.toThrow()
    expect(storage.isConnected()).toBe(false)
  })

  it('servidor fora do ar rejeita sem travar a fila de uploads', async () => {
    const storage = new FtpCameraStorage({ host: '127.0.0.1', port: 2198, user: 'x', password: 'y' })
    await expect(storage.test()).rejects.toThrow()
    await expect(storage.test()).rejects.toThrow()
  })
})
