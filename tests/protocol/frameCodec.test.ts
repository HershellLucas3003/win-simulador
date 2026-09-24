import { buildDataFrame, encodePayload } from '../../src/server/protocol/frameEncoder'
import { decodePayload, trimAxleArrays } from '../../src/server/protocol/frameDecoder'
import { PAYLOAD_SIZE, REAL_EQUIPMENT_FRAME_SIZE } from '../../src/server/protocol/constants'
import type { VehicleReading } from '../../src/shared/vehicle'
import { REAL_FRAMES, capturedFrameAtLine } from '../fixtures/realFrames'

const REAL_PAYLOAD_SIZE = REAL_EQUIPMENT_FRAME_SIZE - 2

describe('frameEncoder contra frames reais do equipamento', () => {
  it.each(REAL_FRAMES)('$label gera exatamente os bytes capturados', ({ frameLine, reading }) => {
    const captured = capturedFrameAtLine(frameLine)
    expect(captured.length).toBe(REAL_EQUIPMENT_FRAME_SIZE)

    const frame = buildDataFrame(encodePayload(reading))

    expect(frame.subarray(0, REAL_EQUIPMENT_FRAME_SIZE).toString('hex')).toBe(captured.toString('hex'))
  })

  it.each(REAL_FRAMES)('$label decodifica o frame capturado nos mesmos campos', ({ frameLine, reading }) => {
    const payload = capturedFrameAtLine(frameLine).subarray(2)

    expect(trimAxleArrays(decodePayload(payload))).toEqual(reading)
  })

  it('completa com zero o que o equipamento real nao envia', () => {
    const payload = encodePayload(REAL_FRAMES[0].reading)

    expect(payload.length).toBe(PAYLOAD_SIZE)
    expect(payload.subarray(REAL_PAYLOAD_SIZE).every((byte) => byte === 0)).toBe(true)
  })
})

describe('frameEncoder em valores limite', () => {
  const base = REAL_FRAMES[2].reading

  const roundTrip = (reading: VehicleReading) => trimAxleArrays(decodePayload(encodePayload(reading)))

  it('aceita gross no maximo de u32', () => {
    expect(roundTrip({ ...base, gross: 0xffffffff }).gross).toBe(0xffffffff)
  })

  it('codifica temperatura negativa como o Java le com cast para short', () => {
    expect(roundTrip({ ...base, temperatureC: -110 }).temperatureC).toBe(-110)
    expect(roundTrip({ ...base, temperatureC: -5 }).temperatureC).toBe(-5)
  })

  it('usa os 10 pesos e 9 espacamentos e descarta o excedente de veiculos com mais eixos', () => {
    const reading: VehicleReading = {
      ...base,
      numAxles: 22,
      axleWeights: Array.from({ length: 22 }, (_, index) => 1000 + index),
      axleSpacings: Array.from({ length: 21 }, (_, index) => 100 + index),
    }

    const decoded = roundTrip(reading)

    expect(decoded.numAxles).toBe(22)
    expect(decoded.axleWeights).toEqual(reading.axleWeights.slice(0, 10))
    expect(decoded.axleSpacings).toEqual(reading.axleSpacings.slice(0, 9))
  })

  it('trunca o codigo de classe em 8 bytes', () => {
    expect(roundTrip({ ...base, classCode: 'ABCDEFGHIJ' }).classCode).toBe('ABCDEFGH')
  })

  it('serial no limite de u32', () => {
    expect(roundTrip({ ...base, serial: 0xffffffff }).serial).toBe(0xffffffff)
    expect(roundTrip({ ...base, serial: 0 }).serial).toBe(0)
  })

  it('rejeita valores fora do tipo do campo em vez de corromper o frame', () => {
    expect(() => encodePayload({ ...base, numAxles: 70000 })).toThrow(RangeError)
    expect(() => encodePayload({ ...base, gross: -1 })).toThrow(RangeError)
    expect(() => encodePayload({ ...base, speedKmh: 7000 })).toThrow(RangeError)
  })
})
