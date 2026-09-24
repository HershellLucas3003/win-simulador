export const POLL_BYTE = 0x98
export const ACK_BYTE = 0xb0
export const HEADER_START = 0xff
export const HEADER_DATA = 0x06
export const HEADER_EMPTY = 0x15

export const HEADER_SIZE = 2
export const PAYLOAD_SIZE = 328
export const FULL_FRAME_SIZE = HEADER_SIZE + PAYLOAD_SIZE
export const REAL_EQUIPMENT_FRAME_SIZE = 240

export const SERIAL_SETTINGS = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
} as const

export const EMPTY_RESPONSE = Buffer.from([HEADER_START, HEADER_EMPTY])
export const DATA_HEADER = Buffer.from([HEADER_START, HEADER_DATA])

export const PAYLOAD_OFFSETS = {
  numAxles: 0,
  classIndex: 2,
  serial: 4,
  classCode: 8,
  lane: 16,
  speed: 18,
  axleWeights: 20,
  axleSpacings: 70,
  length: 118,
  overhang: 120,
  gap: 122,
  unknown134: 134,
  temperature: 136,
  validity: 138,
  gross: 140,
  date: 144,
  unknown152: 152,
  headway: 184,
  direction: 186,
  chassisCode: 188,
  unknown190a: 190,
  unknown190b: 192,
  loopOnTime: 206,
  frontLf: 208,
  middleLf: 210,
  rearLf: 212,
  straddleWindow: 214,
  avgSpeed: 216,
  frontHf: 218,
  middleHf: 220,
  rearHf: 222,
  dateStart: 228,
  unknown236: 236,
  tyreParameter3L: 310,
} as const

export const CLASS_CODE_SIZE = 8
export const TIMESTAMP_SIZE = 8
export const SPEED_SCALE = 10
export const GAP_SCALE = 50
export const HEADWAY_SCALE = 100
export const TEMPERATURE_OFFSET = 100
export const YEAR_BASE = 2000
