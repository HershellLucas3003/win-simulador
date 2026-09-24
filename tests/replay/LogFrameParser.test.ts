import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseLogFrames } from '../../src/server/replay/LogFrameParser'
import { encodePayload } from '../../src/server/protocol/frameEncoder'
import { REAL_FRAMES, REAL_LOG_TEXT } from '../fixtures/realFrames'

describe('LogFrameParser', () => {
  it('extrai os 3 veículos reais do log do site 1', () => {
    const frames = parseLogFrames(REAL_LOG_TEXT)
    expect(frames.map((frame) => frame.view.serial)).toEqual(REAL_FRAMES.map((frame) => frame.reading.serial))
    expect(frames.map((frame) => frame.view.line)).toEqual(REAL_FRAMES.map((frame) => frame.frameLine))
    expect(frames[2].view).toMatchObject({ classIndex: 75, numAxles: 9, gross: 89240, receivedBytes: 240, dateStart: '2026-09-09 13:16:41.248' })
  })

  it('payload do replay é o mesmo que o equipamento enviou, completado com zero', () => {
    const [first] = parseLogFrames(REAL_LOG_TEXT)
    expect(first.payload.length).toBe(328)
    expect(first.payload.equals(encodePayload(REAL_FRAMES[0].reading))).toBe(true)
  })

  it('descarta reenvios consecutivos do mesmo frame', () => {
    const line = REAL_LOG_TEXT.split(/\r?\n/)[556]
    expect(parseLogFrames([line, line, line].join('\n'))).toHaveLength(1)
  })

  it('ignora linhas sem frame FF 06 e texto qualquer', () => {
    expect(parseLogFrames('[x] Frame completo recebido (330 bytes): FF 15\nqualquer coisa')).toHaveLength(0)
  })

  it('lê também o log do site 0 capturado antes do FTP', () => {
    const text = readFileSync(fileURLToPath(new URL('../../../WIM-Service/logs/master-wim-service-site0-2026-09-09.txt', import.meta.url)), 'utf8')
    const frames = parseLogFrames(text)
    expect(frames.length).toBeGreaterThan(0)
    expect(frames[0].view).toMatchObject({ serial: 2106834, classIndex: 77, numAxles: 2 })
  })
})
