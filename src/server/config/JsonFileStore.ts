import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

export class JsonFileStore {
  constructor(private readonly root: string) {}

  resolve(...segments: string[]): string {
    return path.join(this.root, ...segments)
  }

  async read<T>(relativePath: string, fallback: T): Promise<T> {
    const file = this.resolve(relativePath)
    if (!existsSync(file)) return fallback
    return JSON.parse(await readFile(file, 'utf8')) as T
  }

  async write(relativePath: string, value: unknown): Promise<void> {
    const file = this.resolve(relativePath)
    await mkdir(path.dirname(file), { recursive: true })
    const temporary = `${file}.tmp`
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    await rename(temporary, file)
  }

  async list(relativeDir: string): Promise<string[]> {
    const directory = this.resolve(relativeDir)
    if (!existsSync(directory)) return []
    return (await readdir(directory)).filter((file) => file.endsWith('.json'))
  }

  async remove(relativePath: string): Promise<void> {
    await rm(this.resolve(relativePath), { force: true })
  }
}
