import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FrameStamper } from '../src/server/equipment/FrameStamper'
import { OffsetClock } from '../src/server/equipment/OffsetClock'
import { defaultEventConfig } from '../src/server/generation/eventDefaults'
import { listPresets } from '../src/server/generation/presets'
import { seededRandom } from '../src/server/generation/random'
import { VehicleGenerator } from '../src/server/generation/VehicleGenerator'
import { PAYLOAD_SIZE, REAL_EQUIPMENT_FRAME_SIZE, HEADER_SIZE } from '../src/server/protocol/constants'
import { encodeTimestamp, formatTimestampLikeEquipment } from '../src/server/protocol/equipmentDate'
import { encodePayload } from '../src/server/protocol/frameEncoder'
import type { VehicleReading } from '../src/shared/vehicle'
import { clientCatalog, plateCatalog } from '../tests/helpers/catalog'
import { REAL_FRAMES } from '../tests/fixtures/realFrames'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WIM_SERVICE = path.resolve(ROOT, '..', 'WIM-Service')
const MAIN_JAVA = path.join(WIM_SERVICE, 'src/main/java/br/com/tracevia/wimservice/Main.java')
const OUT_DIR = path.join(ROOT, '.cache', 'java')
const M2 = path.join(homedir(), '.m2', 'repository')
const JARS = [
  'com/google/code/gson/gson/2.11.0/gson-2.11.0.jar',
  'com/fazecast/jSerialComm/2.11.0/jSerialComm-2.11.0.jar',
  'commons-net/commons-net/3.11.1/commons-net-3.11.1.jar',
].map((jar) => path.join(M2, jar))

const CLASSPATH = [OUT_DIR, ...JARS].join(path.delimiter)

function run(command: string, args: string[], input?: string) {
  const result = spawnSync(command, args, { input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(`${command} falhou:\n${result.stderr || result.stdout}`)
  return result.stdout
}

function compile() {
  const missing = JARS.filter((jar) => !existsSync(jar))
  if (missing.length > 0) throw new Error(`jars ausentes no ~/.m2 (rode mvn -f ${WIM_SERVICE} dependency:resolve):\n${missing.join('\n')}`)
  mkdirSync(OUT_DIR, { recursive: true })
  run('javac', ['-nowarn', '-d', OUT_DIR, '-cp', CLASSPATH, MAIN_JAVA, path.join(ROOT, 'scripts/java/ContractCheck.java')])
}

function asReceivedByMainJava(payload: Buffer): Buffer {
  const received = Buffer.alloc(PAYLOAD_SIZE)
  payload.copy(received, 0, 0, REAL_EQUIPMENT_FRAME_SIZE - HEADER_SIZE)
  return received
}

function expectedFromReading(reading: VehicleReading) {
  const pad = (values: number[], size: number, limit: number) =>
    Array.from({ length: size }, (_, index) => (index < limit ? values[index] ?? 0 : 0))
  return {
    numAxles: reading.numAxles,
    classIndex: reading.classIndex,
    serial: reading.serial,
    classCode: reading.classCode.slice(0, 8),
    lane: reading.lane,
    speedKmh: Math.round(reading.speedKmh * 10) / 10,
    length: reading.length,
    gapCm: Math.round(reading.gapCm / 50) * 50,
    temperatureC: reading.temperatureC,
    gross: reading.gross,
    headwayMs: Math.round(reading.headwayMs / 100) * 100,
    dateStart: formatTimestampLikeEquipment(encodeTimestamp(reading.dateStart)),
    axleWeights: pad(reading.axleWeights, 10, Math.min(reading.numAxles, 10)),
    axleSpacings: pad(reading.axleSpacings, 9, Math.min(Math.max(reading.numAxles - 1, 0), 9)),
  }
}

function buildCases() {
  const catalog = clientCatalog()
  const random = seededRandom(20260923)
  const generator = new VehicleGenerator(catalog, plateCatalog(), random)
  const stamper = new FrameStamper(new OffsetClock({ now: () => Date.now() }, -206000), random, { nextSerial: 0xfffffff0, counter134: 0, counter152: 0 })
  const cases: { label: string; reading: VehicleReading }[] = REAL_FRAMES.map(({ label, reading }) => ({ label: `real ${label}`, reading }))

  const classIndexes = [...new Set(catalog.data().indexes.map((index) => index.classIndex))]
  for (const classIndex of classIndexes) {
    cases.push({ label: `classe ${classIndex}`, reading: stamper.stamp(generator.generate(defaultEventConfig(catalog, 'c', 'c', classIndex))) })
  }
  for (const preset of listPresets()) {
    for (let draw = 0; draw < 25; draw += 1) {
      const config = { ...defaultEventConfig(catalog, 'p', 'p', null), presetId: preset.id }
      cases.push({ label: `preset ${preset.id}`, reading: stamper.stamp(generator.generate(config)) })
    }
  }
  return cases
}

function main() {
  compile()
  const cases = buildCases()
  const input = cases.map(({ reading }) => asReceivedByMainJava(encodePayload(reading)).toString('hex')).join('\n')
  const lines = run('java', ['-cp', CLASSPATH, 'ContractCheck'], input).trim().split(/\r?\n/)
  if (lines.length !== cases.length) throw new Error(`Main.java devolveu ${lines.length} leituras para ${cases.length} frames`)

  const failures: string[] = []
  lines.forEach((line, index) => {
    const actual = JSON.parse(line) as Record<string, unknown>
    const expected = expectedFromReading(cases[index].reading) as Record<string, unknown>
    for (const [key, value] of Object.entries(expected)) {
      if (JSON.stringify(actual[key]) !== JSON.stringify(value)) {
        failures.push(`${cases[index].label} serial ${cases[index].reading.serial}: ${key} Java=${JSON.stringify(actual[key])} simulador=${JSON.stringify(value)}`)
      }
    }
  })

  if (failures.length > 0) {
    console.error(`${failures.length} divergência(s) entre simulador e Main.java:`)
    failures.slice(0, 40).forEach((failure) => console.error(`  ${failure}`))
    process.exit(1)
  }
  console.log(`OK: ${cases.length} frames gerados pelo simulador decodificados pelo Main.java real com os mesmos valores (frame truncado em 240 bytes, como no equipamento).`)
}

main()
