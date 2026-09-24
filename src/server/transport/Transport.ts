export interface ByteChannel {
  write(bytes: Buffer): Promise<void>
  isOpen(): boolean
}

export type ByteListener = (bytes: Buffer) => void
