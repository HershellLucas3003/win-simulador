import type { NoPlateNaming } from '../../shared/camera'

const two = (value: number) => String(value).padStart(2, '0')
const three = (value: number) => String(value).padStart(3, '0')

export const siteCode = (siteId: number) => two(siteId)

export const dayStamp = (date: Date) => `${date.getFullYear()}${two(date.getMonth() + 1)}${two(date.getDate())}`

export const captureStamp = (date: Date) =>
  `${dayStamp(date)}${two(date.getHours())}${two(date.getMinutes())}${two(date.getSeconds())}${three(date.getMilliseconds())}`

export interface CaptureNames {
  directory: string
  vehicleFile: string
  plateFile: string | null
}

export interface CaptureNameInput {
  rootDir: string
  siteId: number
  capturedAt: Date
  plate: string | null
  escape: boolean
  noPlateNaming: NoPlateNaming
}

export function captureNames(input: CaptureNameInput): CaptureNames {
  const site = siteCode(input.siteId)
  const folder = `WIM_${site}${input.escape ? '_ESCAPE' : ''}`
  const directory = [input.rootDir, folder, dayStamp(input.capturedAt)].filter(Boolean).join('/')
  const base = `WIM_${site}_${captureStamp(input.capturedAt)}`

  if (!input.plate) {
    const suffix = input.noPlateNaming === 'unknown' ? 'unknown' : ''
    return { directory, vehicleFile: `${base}_${suffix}.jpg`, plateFile: null }
  }

  const vehicleFile = `${base}_${input.plate}.jpg`
  return { directory, vehicleFile, plateFile: `Plate${vehicleFile}` }
}
