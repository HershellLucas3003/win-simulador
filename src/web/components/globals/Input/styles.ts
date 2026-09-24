import styled from 'styled-components'

export const Wrapper = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

export const Label = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Control = styled.div<{ $hasError: boolean }>`
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme, $hasError }) => ($hasError ? theme.colors.error : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius};
  background: #fff;
  box-shadow: ${({ $hasError }) => ($hasError ? '0 0 0 1px rgba(244, 67, 54, 0.25)' : 'none')};

  &:focus-within {
    border-color: ${({ theme, $hasError }) => ($hasError ? theme.colors.error : theme.colors.focus)};
  }
`

export const Field = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  padding: 7px 10px;
  color: ${({ theme }) => theme.colors.text};

  &:disabled {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

export const Suffix = styled.span`
  padding: 0 10px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const ErrorMessage = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.error};
`
