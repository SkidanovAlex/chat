import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import Sources from './sources';
import Messages from './messages';
import { theme, Button } from '../theme';

const ChatFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

export const LeftFrame = styled.div`
  background-color: ${theme.annaGray2};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 20%;
  height: 100%;
  min-width: 200px;
`

export const RightFrame = styled.div`
  background-color: ${theme.nearBlack};
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 80%;
  height: 100%;
`

export default function Chat(app) {
  return (
    <ChatFrame>
      <LeftFrame>
        <Sources app={app}/>
      </LeftFrame>
      <RightFrame>
        <Messages app={app}/>
      </RightFrame>
    </ChatFrame>
  )
}
