export interface UploadFile {
  localPath: string
  remoteName: string
}

export interface CameraStorage {
  upload(directory: string, files: UploadFile[]): Promise<void>
  test(): Promise<void>
  close(): Promise<void>
  isConnected(): boolean
}
