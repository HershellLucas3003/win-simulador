import styled from 'styled-components'

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

export const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
`

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const Body = styled.div<{ $scroll: boolean; $padded: boolean }>`
  flex: 1;
  min-height: 0;
  padding: ${({ $padded }) => ($padded ? '14px' : '0')};
  overflow: ${({ $scroll }) => ($scroll ? 'auto' : 'visible')};
`
