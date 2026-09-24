import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ClassCatalogData } from '../../src/shared/classes'
import { ClassCatalog } from '../../src/server/generation/ClassCatalog'
import { PlateCatalog } from '../../src/server/generation/PlateCatalog'

export const CLASSES_PATH = fileURLToPath(new URL('../../config/classes.json', import.meta.url))
export const IMAGE_ROOT = fileURLToPath(new URL('../../assets/img', import.meta.url))

export const clientCatalog = () => new ClassCatalog(JSON.parse(readFileSync(CLASSES_PATH, 'utf8')) as ClassCatalogData)

export const plateCatalog = () => new PlateCatalog(IMAGE_ROOT)
