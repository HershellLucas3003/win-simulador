import styled from 'styled-components'

export const Wrapper = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: none;
  margin: 0;
  padding: 0;
  min-width: 0;
`

export const Legend = styled.legend`
  padding: 0;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 6px;
`

export const Separator = styled.span`
  padding-top: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`
