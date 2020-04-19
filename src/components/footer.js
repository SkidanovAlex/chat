import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import { theme, Button, LeftFrame, RightFrame } from '../theme';

const FooterFrame = styled.div`
  background-color: ${theme.tokenRowHover};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const Title = styled.div`
  display: flex;
  align-items: center;
  margin: 0.5rem;

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

const Input = styled.input`
  white-space: nowrap;
  margin: 0 0.25rem 0 0.25rem;
  padding: 0.5rem;
  border-radius: 1px;
  transition: 0.2s all ease-in-out;
  font-size: 0.83rem;
  min-width: 200px;
  background-color: ${theme.annaGray2};
  width: 100%;
`

const Block = styled.div`
  margin: 0.5rem;
`

export default function Sender({app}) {
  let onEnterPress = (e) => {
    if(e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault();
      app.submitMessage();
    }
  }
  
  return (
    <FooterFrame>
      <LeftFrame>
        <Block>Search</Block>
        <Block>Settings</Block>
      </LeftFrame>
      <RightFrame>
        <Input type="text" id="input" placeholder="Enter your message here" onKeyDown={(e) => onEnterPress(e)}/>
        <Title>
          <Button onClick={() => app.submitMessage()}>Send</Button>
        </Title>
      </RightFrame>
    </FooterFrame>
  )
}
