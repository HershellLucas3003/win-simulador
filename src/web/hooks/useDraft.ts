import { useCallback, useEffect, useRef, useState } from 'react'

export interface Draft<T> {
  value: T
  dirty: boolean
  set: (next: T) => void
  patch: (partial: Partial<T>) => void
  reset: () => void
  markSaved: () => void
}

export function useDraft<T>(source: T, sourceKey: string): Draft<T> {
  const [value, setValue] = useState<T>(source)
  const [dirty, setDirty] = useState(false)
  const lastKey = useRef(sourceKey)
  const latestSource = useRef(source)
  latestSource.current = source

  useEffect(() => {
    if (lastKey.current === sourceKey) return
    lastKey.current = sourceKey
    if (!dirty) setValue(source)
  }, [sourceKey, source, dirty])

  const set = useCallback((next: T) => {
    setValue(next)
    setDirty(true)
  }, [])

  const patch = useCallback((partial: Partial<T>) => {
    setValue((current) => ({ ...current, ...partial }))
    setDirty(true)
  }, [])

  const reset = useCallback(() => {
    setValue(latestSource.current)
    setDirty(false)
  }, [])

  const markSaved = useCallback(() => setDirty(false), [])

  return { value, dirty, set, patch, reset, markSaved }
}
