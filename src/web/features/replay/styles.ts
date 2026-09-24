import styled from 'styled-components'

export const HiddenFile = styled.input`
  display: none;
`

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

export const FileName = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Spacer = styled.span`
  flex: 1;
`

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Row = styled.li<{ $selected: boolean }>`
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid ${({ theme, $selected }) => ($selected ? theme.colors.accent : theme.colors.border)};
`

export const RowBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`

export const Title = styled.span`
  font-weight: 700;
`

export const Muted = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Hex = styled.code`
  font-family: ${({ theme }) => theme.mono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
