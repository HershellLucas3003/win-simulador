import styled from 'styled-components'

export const Layout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 12px;
  align-content: start;
`

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`

export const Description = styled.p`
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

export const Hint = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`
