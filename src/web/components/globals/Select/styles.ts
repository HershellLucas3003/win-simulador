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

export const Field = styled.select<{ $hasError: boolean }>`
  border: 1px solid ${({ theme, $hasError }) => ($hasError ? theme.colors.error : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius};
  background: #fff;
  padding: 7px 8px;
  color: ${({ theme }) => theme.colors.text};
  min-width: 0;

  &:focus {
    outline: none;
    border-color: ${({ theme, $hasError }) => ($hasError ? theme.colors.error : theme.colors.focus)};
  }
`

export const ErrorMessage = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.error};
`
