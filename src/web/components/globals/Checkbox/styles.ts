import styled from 'styled-components'

export const Wrapper = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  user-select: none;
`

export const Box = styled.input`
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: ${({ theme }) => theme.colors.primary};
`
