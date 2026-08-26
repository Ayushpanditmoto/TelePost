import { createGlobalStyle } from 'styled-components'
import type { Theme } from './theme'

// `theme` is injected by the ThemeProvider so it must be allowed to be absent
// when GlobalStyle is rendered (making it required causes TS2741).
const GlobalStyle = createGlobalStyle<{ theme?: Theme }>`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.font.family};
    font-size: ${({ theme }) => theme.font.size.md};
    font-weight: ${({ theme }) => theme.font.weight.normal};
    line-height: ${({ theme }) => theme.font.lineHeight.normal};
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.bg.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
  }

  input, textarea {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    background: none;
    border: none;
    outline: none;
  }

  ul, ol {
    list-style: none;
  }

  img, video {
    max-width: 100%;
    display: block;
  }

  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 2px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  ::selection {
    background: rgba(33, 150, 243, 0.3);
  }

  /* Landing page smooth scroll offset for anchor links */
  [id] {
    scroll-margin-top: 80px;
  }
`

export default GlobalStyle
