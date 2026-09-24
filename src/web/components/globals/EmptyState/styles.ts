import styled from 'styled-components'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  font-size: 13px;

  svg {
    font-size: 28px;
    opacity: 0.6;
  }
`
