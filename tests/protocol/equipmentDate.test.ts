import {
  decodeTimestamp,
  encodeTimestamp,
  formatTimestampLikeEquipment,
  timestampFromDate,
  timestampToDate,
} from '../../src/server/protocol/equipmentDate'

const at = (millisecond: number) => ({ year: 2026, month: 9, day: 9, hour: 13, minute: 16, second: 10, millisecond })

describe('equipmentDate', () => {
  it.each([
    [0, '2026-09-09 13:16:10.000'],
    [7, '2026-09-09 13:16:10.007'],
    [44, '2026-09-09 13:16:10.044'],
    [70, '2026-09-09 13:16:10.070'],
    [344, '2026-09-09 13:16:10.344'],
    [700, '2026-09-09 13:16:10.700'],
    [999, '2026-09-09 13:16:10.999'],
  ])('milissegundo %i fica %s no formato do Main.java', (millisecond, expected) => {
    expect(formatTimestampLikeEquipment(encodeTimestamp(at(millisecond)))).toBe(expected)
  })

  it('usa a mesma ordem de bytes da captura real', () => {
    expect([...encodeTimestamp(at(344))]).toEqual([9, 9, 26, 13, 16, 10, 3, 44])
  })

  it('ida e volta preserva todos os campos', () => {
    const value = { year: 2031, month: 12, day: 31, hour: 23, minute: 59, second: 59, millisecond: 999 }
    expect(decodeTimestamp(encodeTimestamp(value))).toEqual(value)
  })

  it('converte a partir de Date local sem perder milissegundos', () => {
    const date = new Date(2026, 0, 1, 0, 0, 0, 5)
    expect(timestampToDate(timestampFromDate(date)).getTime()).toBe(date.getTime())
  })

  it('rejeita buffer curto', () => {
    expect(() => decodeTimestamp(Buffer.alloc(4))).toThrow(RangeError)
  })
})
