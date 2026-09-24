import { useCallback, useState } from 'react'
import type { FieldErrors } from '../../shared/validation'
import { useToast } from '../contexts/ToastContext'
import { ApiError, errorMessage } from '../services/http'

export interface ActionOptions {
  success?: string
}

export interface ActionState {
  running: boolean
  fieldErrors: FieldErrors
  fieldError: (key: string) => string | null
  clearFieldError: (key: string) => void
  run: <T>(action: () => Promise<T>, options?: ActionOptions) => Promise<T | undefined>
}

export function useAction(): ActionState {
  const toast = useToast()
  const [running, setRunning] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const run = useCallback(
    async <T,>(action: () => Promise<T>, options: ActionOptions = {}) => {
      setRunning(true)
      try {
        const result = await action()
        setFieldErrors({})
        if (options.success) toast.success(options.success)
        return result
      } catch (error) {
        if (error instanceof ApiError && error.hasFieldErrors()) setFieldErrors(error.fields)
        else toast.error(errorMessage(error))
        return undefined
      } finally {
        setRunning(false)
      }
    },
    [toast],
  )

  const fieldError = useCallback((key: string) => fieldErrors[key] ?? null, [fieldErrors])

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }, [])

  return { running, fieldErrors, fieldError, clearFieldError, run }
}
