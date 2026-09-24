import styled from 'styled-components'

export const SaveRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 14px;

  label {
    flex: 1;
  }
`

export const Hint = styled.p`
  margin: 0 0 14px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  th {
    font-size: 11px;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

export const RowActions = styled.td`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`
