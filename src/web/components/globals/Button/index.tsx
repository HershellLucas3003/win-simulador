import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { FaSpinner } from 'react-icons/fa'
import * as S from './styles'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: S.ButtonVariant
  size?: S.ButtonSize
  icon?: ReactNode
  loading?: boolean
}

export function Button({ variant = 'default', size = 'md', icon, loading = false, disabled, children, type = 'button', ...props }: ButtonProps) {
  return (
    <S.Button {...props} type={type} $variant={variant} $size={size} disabled={disabled || loading}>
      {loading ? (
        <S.Spinner>
          <FaSpinner />
        </S.Spinner>
      ) : (
        icon
      )}
      {children}
    </S.Button>
  )
}
