import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa'
import * as S from './styles'
import type { ToastApi, ToastItem, ToastTone } from './types'

const DURATION_MS = 4500

const ICONS: Record<ToastTone, ReactNode> = {
  success: <FaCheckCircle />,
  error: <FaTimesCircle />,
  info: <FaInfoCircle />,
  warning: <FaExclamationTriangle />,
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = Date.now() + Math.random()
    setItems((current) => [...current.slice(-3), { id, tone, message }])
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), DURATION_MS)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <S.Stack aria-live="polite">
        {items.map((item) => (
          <S.Toast key={item.id} $tone={item.tone} role="status">
            {ICONS[item.tone]}
            <S.Message>{item.message}</S.Message>
          </S.Toast>
        ))}
      </S.Stack>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast precisa estar dentro de ToastProvider')
  return value
}
