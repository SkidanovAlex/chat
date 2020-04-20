import styled, { keyframes } from 'styled-components'
import { darken } from 'polished'
import { createGlobalStyle, css } from 'styled-components'

const white = '#FFFFFF'
const black = '#000000'

export const theme = ({
  white,
  black,
  textColor: white,
  greyText: white,

  // for setting css on <html>
  backgroundColor: '#24272A',

  modalBackground: 'rgba(0,0,0,0.6)',
  inputBackground: black,
  placeholderGray: '#5F5F5F',
  shadowColor: '#000',

  // grays
  concreteGray: '#292C2F',
  mercuryGray: '#333333',
  silverGray: '#737373',
  chaliceGray: '#7B7B7B',
  doveGray: '#C4C4C4',
  mineshaftGray: '#E1E1E1',
  activeGray: '#292C2F',
  buttonOutlineGrey: '#FAFAFA',
  annaGray: '#191A1C',
  annaGray2: '#2E3338',
  tokenRowHover: '#404040',

  //blacks 
  nearBlack: '#24272A',
  charcoalBlack: '#F2F2F2',
  // blues
  zumthorBlue: '#212529',
  malibuBlue: '#FF585D',
  royalBlue: '#FF585D',
  loadingBlue: '#e4f0ff',

  // purples
  wisteriaPurple: '#FF585D',
  // reds
  salmonRed: '#FF6871',
  // orange
  pizazzOrange: '#FF8F05',
  // yellows
  warningYellow: '#FFE270',
  // pink
  uniswapPink: '#FF585D',
  //green
  connectedGreen: '#27AE60',

  //specific
  textHover: '#FF585D',

  // connect button when loggedout
  buttonFaded: '#FF585D',

  // css snippets
  flexColumnNoWrap: css`
    display: flex;
    flex-flow: column nowrap;
  `,
  flexRowNoWrap: css`
    display: flex;
    flex-flow: row nowrap;
  `
})

export const GlobalStyle = createGlobalStyle`
  @import url('https://rsms.me/inter/inter.css');
  html { font-family: 'Inter', sans-serif; }
  @supports (font-variation-settings: normal) {
    html { font-family: 'Inter var', sans-serif; }
  }

  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  body > div {
    height: 100%;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
}

  html {
    font-size: 16px;
    font-variant: none;
    color: ${theme.textColor};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
`


export const Button = styled.button.attrs(({ warning }) => ({
  backgroundColor: warning ? theme.salmonRed : theme.royalBlue
}))`
  padding: 0.5rem 1.5rem 0.5rem 1.5rem;
  border-radius: 3rem;
  cursor: pointer;
  user-select: none;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  outline: none;
  background-color: ${({ backgroundColor }) => backgroundColor};
  color: ${theme.nearBlack};
  width: 100%;

  :hover,
  :focus {
    background-color: ${({ backgroundColor }) => darken(0.05, backgroundColor)};
  }

  :active {
    background-color: ${({ backgroundColor }) => darken(0.1, backgroundColor)};
  }

  :disabled {
    background-color: ${theme.concreteGray};
    color: ${theme.silverGray};
    cursor: auto;
  }
`

export const Link = styled.a.attrs({
  target: '_blank',
  rel: 'noopener noreferrer'
})`
  text-decoration: none;
  cursor: pointer;
  color: ${theme.royalBlue};

  :focus {
    outline: none;
    text-decoration: underline;
  }

  :active {
    text-decoration: none;
  }
`

export const BorderlessInput = styled.input`
  color: ${theme.textColor};
  font-size: 1rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${theme.inputBackground};

  [type='number'] {
    -moz-appearance: textfield;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${theme.chaliceGray};
  }
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

export const Spinner = styled.img`
  animation: 2s ${rotate} linear infinite;
  width: 16px;
  height: 16px;
`

export const Text = styled.p`
  flex: 1 1 auto;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 0.83rem;
`

export const LeftFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 20%;
  height: 100%;
  min-width: 200px;
`

export const RightFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 80%;
  height: 100%;
`