import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    margin: 0;
  }

  body {
    font-family: ${({ theme }) => theme.font};
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.background};
  }

  button, input, select, textarea {
    font: inherit;
  }
`
