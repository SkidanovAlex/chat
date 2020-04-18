import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import { Button, Input, theme } from "../theme";

const SourcesFrame = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
`

const SourceName = styled.div`
  display: flex;
  margin: 0.5rem;
  font-weight: 500;
  font-size: 18;

  :hover {
    cursor: default;
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

export default function Sources(app) {
  let channels = ['General', 'Staking', 'DevX'];
  let threads = [];
  for (const [key, value] of window.threads.entries()) {
    threads.push(value)
  }
  console.log(threads);
  return (
    <SourcesFrame id="sources">
      <Channel key="" onClick={() => {app.updateChannelThread(null, 0)}}>All messages</Channel>
      <Rule/>
      <SourceName>Channels</SourceName>
      {channels.map(channel => (
        <Channel key={channel} onClick={() => {app.updateChannelThread(channel, 0)}}>{channel}</Channel>
      ))}
      <Rule/>
      <SourceName>Threads</SourceName>
      {threads.map(thread => (
        <Channel key={thread.thread_id} onClick={() => app.updateChannelThread(thread.channel, thread.thread_id)}>{thread.name}</Channel>
      ))}
      <Rule/>
      <SourceName>Private</SourceName>
    </SourcesFrame>
  )
}