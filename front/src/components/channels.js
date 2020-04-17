import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import { Button, Input, theme } from "../theme";

const ChannelsFrame = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  width: 100%;
`

const ChannelHeader = styled.div`
  display: flex;
  margin: 0.5rem;
  font-weight: 500;
  font-size: 18;

  :hover {
    cursor: pointer;
  }
`

const Channel = styled.div`
  margin: 0.5rem;
  display: flex;
  align-items: center;
  color: ${theme.uniswapPink};

  :hover {
    cursor: pointer;
    color: ${darken(0.2, theme.uniswapPink)};
  }
`

const Rule = styled.div`
  width: 100%;
  border: 0.5px solid ${theme.tokenRowHover};
`

export default function Channels({app}) {
  let channels = ['General', 'Staking', 'DevX'];
  return (
    <ChannelsFrame>
      <Channel key="" onClick={() => app.updateChannel(null)}>All messages</Channel>
      <Rule/>
      <ChannelHeader>Channels</ChannelHeader>
      {channels.map(channel => (
        <Channel key={channel} onClick={() => app.updateChannel(channel)}>{channel}</Channel>
      ))}
      <Rule/>
      <ChannelHeader>Threads</ChannelHeader>
      {channels.map(channel => (
        <Channel key={channel} onClick={() => app.updateChannel(channel)}>{channel}</Channel>
      ))}
      <Rule/>
      <ChannelHeader>Private</ChannelHeader>
      {channels.map(channel => (
        <Channel key={channel} onClick={() => app.updateChannel(channel)}>{channel}</Channel>
      ))}
    </ChannelsFrame>
  )
}
