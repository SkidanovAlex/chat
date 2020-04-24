import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import { theme } from "../theme";

const MessagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`

const MessageWrapper = styled.div.attrs(({ is_chosen }) => ({
  backgroundColor: is_chosen ? darken(0.05, theme.nearBlack) : theme.nearBlack
}))`
  flex: 0 0 auto;
  margin: 0 0.5rem 0 0.5rem;
  padding: 0.25rem 0.25rem 0.25rem 0.25rem;
  display: flex;
  border: none;
  outline: none;
  flex-direction: column;
  color: ${theme.white};
  overflow: hidden;
  background-color: ${({ backgroundColor }) => backgroundColor};

  :hover {
    background-color: ${({ backgroundColor, is_chosen }) => !is_chosen ? darken(0.02, backgroundColor) : backgroundColor};
  }
`

const MessageHeader = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: row;
`

const MessageData = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: row;
`

const Sender = styled.div`
  font-size: 1rem;
  margin-right: 0.5rem;
`

const Text = styled.div`
  font-size: 1.5rem;
`

const Channel = styled.div`
  font-size: 0.67rem;
  margin-right: 0.5rem;
`

const Pending = styled.div`
  font-size: 0.67rem;
  margin-right: 0.5rem;
  color: ${theme.silverGray};
  :hover {
    cursor: pointer;
    color: ${darken(0.1, theme.silverGray)};
  }
`

const ThreadName = styled.div`
  color: ${theme.salmonRed};
  font-size: 0.67rem;
  :hover {
    cursor: pointer;
    color: ${darken(0.1, theme.salmonRed)};
  }
`

const MessageTitle = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: row;
  font-size: 0.83rem;
`

const StartThread = styled.div`
  text-decoration: underline;
  font-weight: 500;
  color: ${theme.salmonRed};
  font-size: 0.83rem;
  :hover {
    cursor: pointer;
    color: ${darken(0.1, theme.salmonRed)};
  }
`

// https://stackoverflow.com/questions/36130760/use-justify-content-flex-end-and-to-have-vertical-scrollbar
const EmptySpace = styled.div`
  margin-top: auto !important;
`

const ThreadInput = styled.input`
  white-space: nowrap;
  padding: 0.2rem;
  border-radius: 1px;
  transition: 0.2s all ease-in-out;
  font-size: 0.67rem;
  min-width: 200px;
  background-color: ${theme.annaGray2};
`

class Messages extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      app: props.app,
      messages: [],
      channel: null,
      chosenMsg: null,
    }
  }

  componentDidMount() {
    this.state.app.setState({messagesObj: this})
  }

  refresh(e) {
    e.stopPropagation();
    this.state.app.reloadData()
  }

  updateMessages(messages) {
    this.setState({messages: messages, chosenMsg: null})
  }

  appendMessage(message) {
    let messages = this.state.messages;
    messages.push(message);
    this.setState({messages: messages});
  }

  messageClick(message_id) {
    console.log('messageClick', message_id);
    for (var i = 0; i < this.state.messages.length; i++) {
      if (this.state.messages[i].message_id === message_id) {
        this.setState({chosenMsg: this.state.messages[i]});
        break;
      }
    }
  }

  changeThreadClick(message_id) {
    console.log('changeThreadClick', message_id);
    for (var i = 0; i < this.state.messages.length; i++) {
      if (this.state.messages[i].message_id === message_id) {
        this.state.app.state.sourcesObj.updateChannelThreadId(this.state.messages[i].channel, this.state.messages[i].thread_id);
        break;
      }
    }
  }

  createThreadClick(e) {
    e.stopPropagation();
    const msg = this.state.chosenMsg
    this.state.app.createThread(msg)
    const thread = {thread_id: msg.message_id, channel: msg.channel, name: "Unnamed Thread"}
    this.state.app.threadsMap.set(msg.message_id, thread)
    this.state.app.state.sourcesObj.setState({
      currentThreadId: msg.message_id,
      currentChannel: msg.channel
    })
    this.state.app.refreshHeader()
    this.updateMessages([msg])
  }

  render_message(message_id, text, sender, channel, thread, is_pending) {
    const is_chosen = (!!this.state.chosenMsg) ? (message_id === this.state.chosenMsg.message_id) : false;
    return (
      <MessageWrapper is_chosen={is_chosen} key={message_id} onClick={() => this.messageClick(message_id)}>
        <MessageHeader>
          <MessageTitle>
            <Sender>{sender}</Sender>
            <Channel>{channel}</Channel>
            {is_pending ? (
              <Pending onClick={e => this.refresh(e)}>Pending...</Pending>
            ) : (
              null
            )}
            {!!thread ? (
              <ThreadName onClick={() => this.changeThreadClick(message_id)}>{thread.name}</ThreadName>
            ) : (
              is_chosen && !is_pending ? (
                <StartThread onClick={e => this.createThreadClick(e)}>Start a thread</StartThread>
              ) : (
                null
              )
            )}
          </MessageTitle>
        </MessageHeader>
        <MessageData>
          <Text>
            {text}
          </Text>
        </MessageData>
      </MessageWrapper>
    )
  }

  render() {
    if (!this.state.app.state.messagesObj) {
      // Not ready to render
      return null;
    }
    return (
      <MessagesWrapper>
        <EmptySpace/>
        {this.state.messages.map(msg => (
          this.render_message(msg.message_id, msg.text, msg.sender, msg.channel, this.state.app.threadsMap.get(msg.thread_id), msg.is_pending)
        ))}
      </MessagesWrapper>
    )
  }
}

export default Messages;