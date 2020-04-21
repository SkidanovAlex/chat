import React from 'react'
import styled from 'styled-components'

import Sources from './sources';
import Messages from './messages';
import { theme } from '../theme';

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
  overflow-x: hidden;
  overflow-y: auto;
`

export const RightFrame = styled.div`
  background-color: ${theme.nearBlack};
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 80%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
`

export default function Chat({app}) {
  return (
    <ChatFrame>
      <LeftFrame>
        <Sources app={app}/>
      </LeftFrame>
      <RightFrame id="messages_frame">
        <Messages app={app}/>
      </RightFrame>
    </ChatFrame>
  )
}
