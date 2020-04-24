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
      app: props.app,
      channels: ['General', 'Staking', 'DevX'],
      threads: [],
      currentChannel: null,
      currentThreadId: null,
      renamingThread: false,
    }
  }

  componentDidMount() {
    this.state.app.setState({sourcesObj: this})
  }

  componentDidUpdate() {
    if (this.state.renamingThread) {
      let input = document.getElementById("source_rename_input");
      input.value = this.state.app.threadsMap.get(this.state.currentThreadId).name;
      input.focus();
    }
  }

  updateChannelThreadId(channel, threadId) {
    if (this.state.currentChannel === channel && this.state.currentThreadId === threadId) {
      return;
    }
    this.state.app.reloadData();
    this.setState({
      currentChannel: channel,
      currentThreadId: threadId,
      renamingThread: false,
    });
  }

  startRenaming(e) {
    e.stopPropagation();
    this.setState({
      renamingThread: true,
    });
  }

  renameThread(e) {
    e.stopPropagation();
    let input = document.getElementById("source_rename_input");
    const newName = input.value;
    const channel = this.state.currentChannel;
    const threadId = this.state.currentThreadId;
    let thread = this.state.app.threadsMap.get(threadId);
    thread.name = newName;
    this.state.app.threadsMap.set(threadId, thread);
    this.state.app.refreshHeader()
    this.state.app.state.messagesObj.forceUpdate();
    this.state.app.renameThread(channel, threadId, newName);
    this.setState({
      renamingThread: false,
    });
  }

  render_source(channel, threadId, text) {
    let onInputPressEnter = (e) => {
      if (e.keyCode === 13 && e.shiftKey === false) {
        e.preventDefault();
        this.renameThread(e);
      }
    }

    const is_chosen = this.state.currentChannel === channel && this.state.currentThreadId === threadId;
    const is_show_rename = is_chosen && threadId && !this.state.renamingThread;
    const is_show_accept = is_chosen && threadId && this.state.renamingThread;
    return (
      <SourceWrapper
        key={channel + (!!threadId ? threadId.toString() : null)}
        is_chosen={is_chosen}
        onClick={() => this.updateChannelThreadId(channel, threadId)}
      >
        {is_show_accept ? (
          <SourceRenameInput id="source_rename_input" onKeyDown={(e) => onInputPressEnter(e)}/>
        ) : (
          <SourceName>{text}</SourceName>
        )}
        {is_show_rename ? (
          <SourceAction onClick={e => this.startRenaming(e)}><img src={imgRename} width="16" height="16" alt="rename"/></SourceAction>
        ) : (null)}
        {is_show_accept ? (
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
    return (
      <SourcesWrapper>
        {this.render_source(null, null, "All messages")}
        <Rule/>
        <SourceHeader>Channels</SourceHeader>
        {this.state.channels.map(channel => this.render_source(channel, null, channel))}
        <Rule/>
        <SourceHeader>Threads</SourceHeader>
        {this.state.threads.map(thread => this.render_source(thread.channel, thread.thread_id, thread.name))}
        <Rule/>
        <SourceHeader>Private</SourceHeader>
      </SourcesWrapper>
    )
  }
}

export default Sources;