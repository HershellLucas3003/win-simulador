import { execFile } from 'node:child_process'
import type { SerialPortInfo } from '../../shared/equipment'

const SERIALCOMM_KEY = 'HKLM\\HARDWARE\\DEVICEMAP\\SERIALCOMM'
const ENTRY_PATTERN = /^\s*(\S+)\s+REG_SZ\s+(\S+)\s*$/

export const parseSerialCommEntries = (output: string): SerialPortInfo[] =>
  output
    .split(/\r?\n/)
    .map((line) => ENTRY_PATTERN.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map(([, device, path]) => ({ path, manufacturer: null, friendlyName: device }))

export const readWindowsRegistryPorts = (): Promise<SerialPortInfo[]> => {
  if (process.platform !== 'win32') return Promise.resolve([])
  return new Promise((resolve) => {
    execFile('reg', ['query', SERIALCOMM_KEY], { windowsHide: true }, (error, stdout) => {
      resolve(error ? [] : parseSerialCommEntries(stdout))
    })
  })
}

export const mergePorts = (primary: SerialPortInfo[], extra: SerialPortInfo[]): SerialPortInfo[] => {
  const known = new Set(primary.map((port) => port.path.toUpperCase()))
  const missing = extra.filter((port) => !known.has(port.path.toUpperCase()))
  return [...primary, ...missing].sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
}
