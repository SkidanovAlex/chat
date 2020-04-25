import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import imgRename from '../rename.png';
import imgAccept from '../accept.png';

import { theme, ThreadAction, ThreadName, ThreadRenameInput } from "../theme";

const SourcesWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  width: 100%;
  height: 100%;
`

const SourceWrapper = styled.div.attrs(({ is_chosen }) => ({
  backgroundColor: is_chosen ? darken(0.05, theme.annaGray2) : theme.annaGray2
}))`
  width: calc(100% - 1rem);
  flex: 0 0 auto;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ backgroundColor }) => backgroundColor};

  :hover {
    cursor: default;
  }
`

const SourceHeader = styled.div`
  display: flex;
  margin: 0.5rem;
  font-weight: 500;
  font-size: 1rem;

  :hover {
    cursor: default;
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
      app: props.app
    }
  }

  componentDidMount() {
    this.state.app.setState({sourcesObj: this})
  }

  updateChannelThread(channelId, threadId) {
    const app = this.state.app
    if (app.state.currentChannelId === channelId && app.state.currentThreadId === threadId) {
      return;
    }
    app.setState({
      currentChannelId: channelId,
      currentThreadId: threadId,
      renamingThread: false,
    });
  }

  renderSource(channelId, threadId, text) {
    const app = this.state.app
    const isChosen = app.state.currentChannelId === channelId && app.state.currentThreadId === threadId;
    return (
      <SourceWrapper
        key={(!!channelId ? channelId.toString() : "") + "~" + (!!threadId ? threadId.toString() : "")}
        is_chosen={isChosen}
        onClick={() => this.updateChannelThread(channelId, threadId)}
      >
        <ThreadName>{text}</ThreadName>
      </SourceWrapper>
    )
  }

  render() {
    if (!this.state.app.state.sourcesObj) {
      // Not ready to render
      return null;
    }
    const app = this.state.app
    console.log('CHANNELS', app.channelsMap);
    console.log('THREADS', app.threadsMap);
    let channels = [];
    app.channelsMap.forEach(channel => channels.push(channel));
    let threads = [];
    app.threadsMap.forEach(thread => threads.push(thread));
    return (
      <SourcesWrapper>
        {this.renderSource(null, null, "All messages")}
        <Rule/>
        <SourceHeader>Channels</SourceHeader>
        {channels.map(channel => this.renderSource(channel.channel_id, null, channel.channel_name))}
        <Rule/>
        <SourceHeader>Threads</SourceHeader>
        {threads.map(thread => this.renderSource(thread.channel_id, thread.thread_id, thread.name))}
        <Rule/>
        <SourceHeader>Private</SourceHeader>
      </SourcesWrapper>
    )
  }
}

export default Sources;