import styled from 'styled-components'

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.layers.modal};
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.45);
`

export const Container = styled.div`
  width: min(440px, calc(100vw - 32px));
  background: ${({ theme }) => theme.colors.modal};
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

export const Title = styled.h3`
  margin: 0;
  font-size: 16px;
`

export const Content = styled.div`
  padding: 16px;
  line-height: 1.5;
`

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`
