import { mergePorts, parseSerialCommEntries } from '../../src/server/transport/windowsRegistryPorts'

const REG_OUTPUT = [
  '',
  'HKEY_LOCAL_MACHINE\\HARDWARE\\DEVICEMAP\\SERIALCOMM',
  '    \\Device\\com0com12    REG_SZ    COM10',
  '    \\Device\\com0com22    REG_SZ    COM11',
  '',
].join('\r\n')

describe('portas do registro do Windows', () => {
  it('lê as portas do SERIALCOMM', () => {
    expect(parseSerialCommEntries(REG_OUTPUT)).toEqual([
      { path: 'COM10', manufacturer: null, friendlyName: '\\Device\\com0com12' },
      { path: 'COM11', manufacturer: null, friendlyName: '\\Device\\com0com22' },
    ])
  })

  it('saída sem entradas devolve lista vazia', () => {
    expect(parseSerialCommEntries('ERRO: chave não encontrada')).toEqual([])
  })

  it('junta sem duplicar e ordena pelo número da porta', () => {
    const detected = [{ path: 'COM3', manufacturer: 'FTDI', friendlyName: 'USB Serial (COM3)' }]
    const registry = [
      { path: 'COM11', manufacturer: null, friendlyName: null },
      { path: 'com3', manufacturer: null, friendlyName: null },
      { path: 'COM10', manufacturer: null, friendlyName: null },
    ]
    expect(mergePorts(detected, registry).map((port) => port.path)).toEqual(['COM3', 'COM10', 'COM11'])
  })
})
