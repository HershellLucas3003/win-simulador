export const theme = {
  colors: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    modal: '#FAFAFA',
    text: '#1F2937',
    textMuted: '#6B7280',
    border: '#E0E0E0',
    focus: '#0057B8',
    primary: '#343A40',
    accent: '#FFD700',
    success: '#4CAF50',
    successSoft: '#DCFCE7',
    error: '#F44336',
    errorStrong: '#B71C1C',
    errorSoft: '#FEE2E2',
    warning: '#FF9800',
    warningSoft: '#FFF3E0',
    info: '#2196F3',
    infoSoft: '#E3F2FD',
    consoleBackground: '#111827',
    consoleText: '#E5E7EB',
  },
  radius: '6px',
  font: "'Segoe UI', Roboto, Arial, sans-serif",
  mono: "Consolas, 'Cascadia Mono', monospace",
  layers: {
    sticky: 2,
    overlay: 9,
    modal: 10,
  },
} as const

export type AppTheme = typeof theme
