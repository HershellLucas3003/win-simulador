import styled from 'styled-components'

export const Bar = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
`

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15px;

  svg {
    color: ${({ theme }) => theme.colors.accent};
    font-size: 20px;
  }
`

export const PortControls = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;

  select {
    min-width: 200px;
  }
`

export const Statuses = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

export const Detail = styled.span`
  font-size: 12px;
  opacity: 0.8;
`

export const Counters = styled.dl`
  display: flex;
  gap: 14px;
  margin: 0 0 0 auto;
`

export const Counter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  dt {
    font-size: 10px;
    text-transform: uppercase;
    opacity: 0.7;
  }

  dd {
    margin: 0;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`
