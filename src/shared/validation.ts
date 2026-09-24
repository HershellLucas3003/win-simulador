export type FieldErrors = Record<string, string>

export interface ValidationFailure {
  error: 'validation'
  fields: FieldErrors
}

export const isValidationFailure = (value: unknown): value is ValidationFailure =>
  typeof value === 'object' && value !== null && (value as ValidationFailure).error === 'validation'
