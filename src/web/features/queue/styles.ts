import styled from 'styled-components'

export const Column = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
`

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Card = styled.li<{ $highlight?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid ${({ theme, $highlight }) => ($highlight ? theme.colors.error : theme.colors.border)};
  border-radius: 6px;
  background: #fff;
`

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`

export const CardTitle = styled.span`
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const Muted = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Badges = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`

export const ProgressLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`
