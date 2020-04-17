import React from 'react'
import styled, { css } from 'styled-components'
import { darken } from 'polished'

import { theme, Link, Button } from '../theme'
import logo from '../logo_white.png';

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const HeaderElement = styled.div`
  margin: 1.25rem;
  display: flex;
  min-width: 0;
  display: flex;
  align-items: center;
`

const Title = styled.div`
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }

  #link {
    text-decoration-color: ${theme.UniswapPink};
  }

  #title {
    display: inline;
    font-size: 1rem;
    font-weight: 500;
    color: ${theme.wisteriaPurple};
    :hover {
      color: ${darken(0.1, theme.wisteriaPurple)};
    }
  }
`

const StatusGeneric = styled.button`
  ${theme.flexRowNoWrap}
  width: 100%;
  font-size: 0.9rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 2rem;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`

const StatusConnect = styled(StatusGeneric)`
  background-color: transparent;
  border: 1px solid ${theme.royalBlue};
  color: ${theme.royalBlue};
  font-weight: 500;

  :hover,
  :focus {
    border: 1px solid ${darken(0.1, theme.royalBlue)};
    color: ${darken(0.1, theme.royalBlue)};
  }

  ${({ faded }) =>
    faded &&
    css`
      background-color: transparent;
      border: 1px solid ${theme.royalBlue};
      color: ${theme.royalBlue};

      :hover,
      :focus {
        border: 1px solid ${darken(0.1, theme.royalBlue)};
        color: ${darken(0.1, theme.royalBlue)};
      }
    `}
`

const LogoFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const LogoElement = styled.div`
  margin: 0.3rem;
  display: flex;
  min-width: 0;
  display: flex;
  align-items: center;
`

export default function Header({connected, signedIn, app}) {
  let status = !connected ? (
    <StatusConnect>Connecting...</StatusConnect>
  ) : (signedIn ? (
    <StatusConnect>Hello {app.state.accountId}</StatusConnect>
  ) : (
    <Button onClick={() => app.requestSignIn()}>Log in with NEAR Wallet</Button>
  ));
  return (
    <HeaderFrame>
      <HeaderElement>
        <Title>
          <Link id="link" href="https://nearprotocol.com">
            <LogoFrame>
              <LogoElement>
              <img src={logo} width="22" height="22" alt="logo"/>
              </LogoElement>
              <LogoElement>
              <h1 id="title">NEAR Chat!</h1>
              </LogoElement>
            </LogoFrame>
          </Link>
        </Title>
      </HeaderElement>
      <HeaderElement>
        <Title>
          {status}
        </Title>
      </HeaderElement>
    </HeaderFrame>
  )
}
