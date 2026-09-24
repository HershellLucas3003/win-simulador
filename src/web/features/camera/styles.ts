import styled from 'styled-components'

export const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
  gap: 12px;
  align-content: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const Grid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 2 }) => $columns}, minmax(0, 1fr));
  gap: 10px 14px;
`

export const Hint = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`

export const Stats = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  margin: 0;
  font-size: 13px;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    word-break: break-all;
    font-family: ${({ theme }) => theme.mono};
    font-size: 12px;
  }
`

export const ErrorText = styled.dd`
  color: ${({ theme }) => theme.colors.errorStrong};
`
