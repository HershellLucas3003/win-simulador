export interface ReplayFrameView {
  index: number
  line: number
  loggedAt: string | null
  receivedBytes: number
  serial: number
  classIndex: number
  classCode: string
  numAxles: number
  gross: number
  speedKmh: number
  dateStart: string
  hex: string
}
