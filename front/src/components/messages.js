import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import { Text, Input, theme } from "../theme";

const MessagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow: auto;
`

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 30px;
  overflow: auto;
  white-space: nowrap;
`

const MessageHeader = styled.div`
  display: flex;
  flex-direction: row;
  margin: 0 0.5rem 0 0;
  font-size: 0.83rem;
`

const Channel = styled.div`
  margin: 0 0.5rem 0 0;
  font-size: 0.67rem;
`

const Thread = styled.div`
  color: ${theme.UniswapPink};
  font-size: 0.67rem;
`

function Message({text, sender, channel, showChannel, thread, showThread}) {
  console.log(showChannel)
  console.log(channel)
  console.log(thread)
  return (
    <MessageWrapper>
      <MessageHeader>
        <Text>{sender}</Text>
        <Channel>{showChannel ? (channel) : (null)}</Channel>
        <Thread>{thread !== text ? (thread) : (null)}</Thread>
      </MessageHeader>
      <Text>{text}</Text>
    </MessageWrapper>
  )
}

export default function Messages({app}) {
  const messages = window.messages;
  const channel = window.channel;
  console.log(messages)
  return (
    <MessagesWrapper>
      {messages.map(msg => (
        <Message
          key={msg.message_id}
          text={msg.text}
          sender={msg.sender}
          channel={msg.channel}
          showChannel={!channel}
          thread={window.threads.get(msg.thread_id)}
        />
      ))}
    </MessagesWrapper>
  )
}
