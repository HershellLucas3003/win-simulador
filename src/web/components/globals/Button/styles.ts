import styled, { css, keyframes } from 'styled-components'

export type ButtonVariant = 'default' | 'secondary' | 'danger' | 'success' | 'ghost'
export type ButtonSize = 'md' | 'sm'

const variants = {
  default: css`
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    border: 1px solid ${({ theme }) => theme.colors.primary};
    &:hover:not(:disabled) {
      background: #23272b;
    }
  `,
  secondary: css`
    background: #fff;
    color: #374151;
    border: 1px solid #d1d5db;
    &:hover:not(:disabled) {
      background: #f3f4f6;
    }
  `,
  danger: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.errorStrong};
    border: 1px solid ${({ theme }) => theme.colors.errorStrong};
    font-weight: 600;
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.errorStrong};
      color: #fff;
    }
  `,
  success: css`
    background: ${({ theme }) => theme.colors.successSoft};
    color: #15803d;
    border: 1px solid #86efac;
    font-weight: 600;
    &:hover:not(:disabled) {
      background: #bbf7d0;
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    border: 1px solid transparent;
    &:hover:not(:disabled) {
      background: #f3f4f6;
    }
  `,
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`

export const Button = styled.button<{ $variant: ButtonVariant; $size: ButtonSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: ${({ theme }) => theme.radius};
  padding: ${({ $size }) => ($size === 'sm' ? '4px 10px' : '7px 15px')};
  font-size: ${({ $size }) => ($size === 'sm' ? '12px' : '14px')};
  cursor: pointer;
  white-space: nowrap;
  ${({ $variant }) => variants[$variant]}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
  }
`

export const Spinner = styled.span`
  display: inline-flex;
  animation: ${spin} 0.8s linear infinite;
`
