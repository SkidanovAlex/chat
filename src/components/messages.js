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
  margin-right: 0.25rem;
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

const Reply = styled.div`
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

class Messages extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      app: props.app,
      messages: [],
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
    for (var i = 0; i < this.state.messages.length; i++) {
      if (this.state.messages[i].message_id === message_id) {
        this.state.app.state.sourcesObj.updateChannelThread(this.state.messages[i].channel_id, this.state.messages[i].thread_id);
        break;
      }
    }
  }

  replyClick(e) {
    e.stopPropagation();
    const msg = this.state.chosenMsg
    const thread = this.state.app.threadsMap.get(msg.thread_id)
    // TODO use one setState
    if (!!thread) {
      this.state.app.setState({
        currentChannelId: thread.channel_id,
        currentThreadId: thread.thread_id,
        renamingThread: false,
      });
    } else {
      this.state.app.setState({
        currentChannelId: msg.channel_id,
        currentThreadId: msg.message_id,
        renamingThread: false,
      })
    }
  }

  renderMessage(message, isPending) {
    const messageId = message.message_id;
    const sender = message.sender;
    const channelName = message.channel;
    const threadName = message.thread_name;
    const text = message.text;
    const isChosen = (!!this.state.chosenMsg) ? (messageId === this.state.chosenMsg.message_id) : false;
    const inThread = threadName !== message.text;
    const threadText = !!threadName ? (threadName) : (message.thread_name);
    return (
      <MessageWrapper is_chosen={isChosen} key={messageId} onClick={() => this.messageClick(messageId)}>
        <MessageHeader>
          <MessageTitle>
            <Sender>{sender}</Sender>
            {inThread ? (
              <ThreadName onClick={() => this.changeThreadClick(messageId)}>» {threadText}</ThreadName>
            ) : (
              isChosen && !isPending ? (
                <Reply onClick={e => this.replyClick(e)}>Reply</Reply>
              ) : (
                null
              )
            )}
            {/*<Channel>{channelName}</Channel>*/}
            {isPending ? (
              <Pending onClick={e => this.refresh(e)}>Pending...</Pending>
            ) : (
              null
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
    console.log("MSG", this.state.messages)
    return (
      <MessagesWrapper>
        <EmptySpace/>
        {this.state.messages.map(msg => (
          this.renderMessage(msg, msg.is_pending)
        ))}
      </MessagesWrapper>
    )
  }
}

export default Messages;