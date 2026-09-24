import type { FieldErrors } from '../../shared/validation'
import { isValidationFailure } from '../../shared/validation'

export class ApiError extends Error {
  constructor(message: string, readonly fields: FieldErrors = {}) {
    super(message)
  }

  hasFieldErrors(): boolean {
    return Object.keys(this.fields).length > 0
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export async function request<T>(method: Method, url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  const payload: unknown = text ? JSON.parse(text) : null
  if (response.ok) return payload as T
  if (isValidationFailure(payload)) throw new ApiError('Verifique os campos destacados', payload.fields)
  const message = (payload as { message?: string } | null)?.message ?? `Falha HTTP ${response.status}`
  throw new ApiError(message)
}

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))
