import styled, { keyframes } from 'styled-components'
import type { ToastTone } from './types'

const slideIn = keyframes`
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`

export const Stack = styled.div`
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: ${({ theme }) => theme.layers.overlay};
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 380px;
`

export const Toast = styled.div<{ $tone: ToastTone }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff;
  border-left: 4px solid ${({ theme, $tone }) => theme.colors[$tone]};
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  animation: ${slideIn} 0.2s ease-out;
  font-size: 13px;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ theme, $tone }) => theme.colors[$tone]};
  }
`

export const Message = styled.span`
  flex: 1;
  word-break: break-word;
`
