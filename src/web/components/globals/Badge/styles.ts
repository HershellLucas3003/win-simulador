import styled, { css } from 'styled-components'

export type BadgeTone = 'neutral' | 'success' | 'error' | 'warning' | 'info'

const tones = {
  neutral: css`
    background: #f3f4f6;
    color: #374151;
  `,
  success: css`
    background: ${({ theme }) => theme.colors.successSoft};
    color: #15803d;
  `,
  error: css`
    background: ${({ theme }) => theme.colors.errorSoft};
    color: ${({ theme }) => theme.colors.errorStrong};
  `,
  warning: css`
    background: ${({ theme }) => theme.colors.warningSoft};
    color: #b45309;
  `,
  info: css`
    background: ${({ theme }) => theme.colors.infoSoft};
    color: #1565c0;
  `,
}

export const Badge = styled.span<{ $tone: BadgeTone }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  ${({ $tone }) => tones[$tone]}
`
