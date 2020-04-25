import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import imgRename from '../rename.png';
import imgAccept from '../accept.png';

import { theme } from "../theme";

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

const SourceName = styled.div`
  color: ${theme.salmonRed};
  font-size: 0.9rem;
  :hover {
    cursor: default;
    color: ${darken(0.2, theme.salmonRed)};
  }
`

const SourceAction = styled.div`
  font-size: 0rem;
  :hover {
    cursor: pointer;
  }
`

const Rule = styled.div`
  width: 100%;
  border: 0.5px solid ${theme.tokenRowHover};
`

const SourceRenameInput = styled.input`
  white-space: nowrap;
  margin-right: 0.5rem;
  padding: 0;
  border-radius: 0px;
  border-width: 0px;
  border: none;
  transition: 0.2s all ease-in-out;
  font-size: 0.9rem;
  width: 100%;
  color: ${theme.mineshaftGray};
  background-color: ${darken(0.05, theme.annaGray2)};
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

  componentDidUpdate() {
    const app = this.state.app
    if (app.state.renamingThread) {
      let input = document.getElementById("source_rename_input");
      input.value = app.threadsMap.get(app.state.currentThreadId).name;
      input.focus();
    }
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

  startRenaming(e) {
    e.stopPropagation();
    this.state.app.setState({
      renamingThread: true,
    });
  }

  renameThread(e) {
    e.stopPropagation();
    const app = this.state.app
    let input = document.getElementById("source_rename_input");
    const newName = input.value;
    const channelId = app.state.currentChannelId;
    const threadId = app.state.currentThreadId;
    // TODO
    /*let thread = app.threadsMap.get(threadId);
    thread.name = newName;
    this.state.app.threadsMap.set(threadId, thread);
    this.state.app.refreshHeader()
    this.state.app.state.messagesObj.forceUpdate();
    this.state.app.renameThread(channel, threadId, newName);
    this.setState({
      renamingThread: false,
    });*/
  }

  renderSource(channelId, threadId, text) {
    let onInputPressEnter = (e) => {
      if (e.keyCode === 13 && e.shiftKey === false) {
        e.preventDefault();
        this.renameThread(e);
      }
    }
    const app = this.state.app
    const isChosen = app.state.currentChannelId === channelId && app.state.currentThreadId === threadId;
    const isShowRename = isChosen && threadId && !app.state.renamingThread;
    const isShowAccept = isChosen && threadId && app.state.renamingThread;
    return (
      <SourceWrapper
        key={(!!channelId ? channelId.toString() : "") + "~" + (!!threadId ? threadId.toString() : "")}
        is_chosen={isChosen}
        onClick={() => this.updateChannelThread(channelId, threadId)}
      >
        {isShowAccept ? (
          <SourceRenameInput id="source_rename_input" onKeyDown={(e) => onInputPressEnter(e)}/>
        ) : (
          <SourceName>{text}</SourceName>
        )}
        {isShowRename ? (
          <SourceAction onClick={e => this.startRenaming(e)}><img src={imgRename} width="16" height="16" alt="rename"/></SourceAction>
        ) : (null)}
        {isShowAccept ? (
          <SourceAction onClick={e => this.renameThread(e)}><img src={imgAccept} width="16" height="16" alt="rename"/></SourceAction>
        ) : (null)}
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
        {threads.map(thread => this.renderSource(thread.channel, thread.thread_id, thread.name))}
        <Rule/>
        <SourceHeader>Private</SourceHeader>
      </SourcesWrapper>
    )
  }
}

export default Sources;