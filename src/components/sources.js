import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import { theme } from "../theme";

const SourcesWrapper = styled.div`
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
  color: ${theme.salmonRed};

  :hover {
    cursor: pointer;
    color: ${darken(0.2, theme.salmonRed)};
  }
`

const Rule = styled.div`
  width: 100%;
  border: 0.5px solid ${theme.tokenRowHover};
`

class Sources extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      app: props.app,
      channels: ['General', 'Staking', 'DevX'],
      threads: [],
      currentChannel: null,
      currentThreadId: null,
    }
  }

  componentDidMount() {
    this.state.app.setState({sourcesObj: this})
  }

  updateChannelThreadId(channel, threadId) {
    this.state.app.reloadData();
    this.setState({
      currentChannel: channel,
      currentThreadId: threadId,
    });
  }

  render() {
    if (!this.state.app.state.sourcesObj) {
      // Not ready to render
      return null;
    }
    return (
      <SourcesWrapper>
        <Channel key="" onClick={() => this.updateChannelThreadId(null, null)}>All messages</Channel>
        <Rule/>
        <SourceName>Channels</SourceName>
        {this.state.channels.map(channel => (
          <Channel key={channel} onClick={() => this.updateChannelThreadId(channel, null)}>{channel}</Channel>
        ))}
        <Rule/>
        <SourceName>Threads</SourceName>
        {this.state.threads.map(thread => (
          <Channel key={thread.thread_id} onClick={() => this.updateChannelThreadId(thread.channel, thread.thread_id)}>{thread.name}</Channel>
        ))}
        <Rule/>
        <SourceName>Private</SourceName>
      </SourcesWrapper>
    )
  }
}

export default Sources;