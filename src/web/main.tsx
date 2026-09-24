import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'styled-components'
import { App } from './App'
import { SimulatorProvider } from './contexts/SimulatorContext'
import { ToastProvider } from './contexts/ToastContext'
import { GlobalStyle } from './theme/GlobalStyle'
import { theme } from './theme/theme'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <ToastProvider>
        <SimulatorProvider>
          <App />
        </SimulatorProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
