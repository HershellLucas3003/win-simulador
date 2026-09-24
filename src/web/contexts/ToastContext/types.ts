export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

export interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}
