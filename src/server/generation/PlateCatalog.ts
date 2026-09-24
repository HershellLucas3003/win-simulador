import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import type { RandomSource } from './random'
import { pickOne, randomInt } from './random'

const PLATE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const IMAGE_EXTENSION = '.jpg'

export function generatePlate(random: RandomSource): string {
  const size = randomInt(random, 7, 8)
  return Array.from({ length: size }, () => PLATE_ALPHABET[randomInt(random, 0, PLATE_ALPHABET.length - 1)]).join('')
}

export function misreadPlate(plate: string): string {
  if (plate.length === 0) return plate
  const last = plate[plate.length - 1]
  const position = PLATE_ALPHABET.indexOf(last)
  const replacement = position < 0 ? last : PLATE_ALPHABET[(position + 1) % PLATE_ALPHABET.length]
  return plate.slice(0, -1) + replacement
}

export class PlateCatalog {
  private readonly platesByFolder = new Map<string, string[]>()

  constructor(private readonly imageRoot: string) {
    this.scan()
  }

  scan(): void {
    this.platesByFolder.clear()
    const plateRoot = path.join(this.imageRoot, 'plate')
    if (!existsSync(plateRoot)) return
    for (const folder of readdirSync(plateRoot, { withFileTypes: true })) {
      if (!folder.isDirectory()) continue
      const plates = readdirSync(path.join(plateRoot, folder.name))
        .filter((file) => file.toLowerCase().endsWith(IMAGE_EXTENSION))
        .map((file) => file.slice(0, -IMAGE_EXTENSION.length))
      this.platesByFolder.set(folder.name, plates)
    }
  }

  folders(): string[] {
    return [...this.platesByFolder.keys()]
  }

  pickPlate(folder: string | null, random: RandomSource): string {
    const plates = folder ? this.platesByFolder.get(folder) ?? [] : []
    return pickOne(random, plates) ?? generatePlate(random)
  }

  vehicleImage(folder: string | null, plate: string): string {
    return this.existingOrUnknown('vehicle', folder, plate)
  }

  plateImage(folder: string | null, plate: string): string {
    return this.existingOrUnknown('plate', folder, plate)
  }

  unknownImage(): string {
    return path.join(this.imageRoot, 'Unknown.jpg')
  }

  private existingOrUnknown(kind: 'vehicle' | 'plate', folder: string | null, plate: string): string {
    if (folder) {
      const candidate = path.join(this.imageRoot, kind, folder, `${plate}${IMAGE_EXTENSION}`)
      if (existsSync(candidate)) return candidate
    }
    return this.unknownImage()
  }
}
