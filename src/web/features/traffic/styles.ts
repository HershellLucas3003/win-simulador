import styled from 'styled-components'
import type { TrafficKind } from '../../../shared/equipment'

const KIND_COLORS: Record<TrafficKind, string> = {
  rx: '#60A5FA',
  tx: '#34D399',
  info: '#D1D5DB',
  warn: '#FBBF24',
  error: '#F87171',
}

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  label:has(input[type='search']) {
    width: 220px;
  }
`

export const Spacer = styled.span`
  flex: 1;
`

export const Console = styled.div`
  height: 100%;
  overflow: auto;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.consoleBackground};
  color: ${({ theme }) => theme.colors.consoleText};
  font-family: ${({ theme }) => theme.mono};
  font-size: 12px;
  line-height: 1.5;
  border-radius: 0 0 8px 8px;
`

export const Line = styled.div`
  white-space: pre-wrap;
  word-break: break-all;
`

export const Time = styled.span`
  color: #9ca3af;
`

export const Kind = styled.span<{ $kind: TrafficKind }>`
  display: inline-block;
  width: 52px;
  font-weight: 700;
  color: ${({ $kind }) => KIND_COLORS[$kind]};
`

export const Hex = styled.span`
  color: #a5b4fc;
`

export const Empty = styled.div`
  color: #9ca3af;
`
