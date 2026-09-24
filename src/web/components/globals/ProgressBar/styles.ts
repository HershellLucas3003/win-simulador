import styled from 'styled-components'

export type ProgressTone = 'info' | 'success' | 'error' | 'warning'

export const Track = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  overflow: hidden;
`

export const Fill = styled.div.attrs<{ $value: number }>(({ $value }) => ({
  style: { width: `${Math.round($value * 100)}%` },
}))<{ $value: number; $tone: ProgressTone }>`
  height: 100%;
  background: ${({ theme, $tone }) => theme.colors[$tone]};
  transition: width 0.25s linear;
`
