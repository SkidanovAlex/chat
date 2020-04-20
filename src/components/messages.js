import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import { theme } from "../theme";

const MessagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
`

const MessageWrapper = styled.div`
  margin: 0.5rem 0 0 0.5rem;
  display: flex;
  flex-direction: column;
`

const MessageHeader = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: row;
  font-size: 0.83rem;
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

const Thread = styled.div`
  color: ${theme.UniswapPink};
  font-size: 0.67rem;
`

function Message({text, sender, channel, showChannel, thread}) {
  const channelRendered = showChannel ? (<Channel>{channel}</Channel>) : (null);
  return (
    <MessageWrapper>
      <MessageHeader>
        <Sender>{sender}</Sender>
        {channelRendered}
        <Thread>{thread != null ? (thread.name) : (null)}</Thread>
      </MessageHeader>
      <Text>{text}</Text>
    </MessageWrapper>
  )
}

export default function Messages(app) {
  const messages = window.messages;
  const channel = window.channel;
  console.log(messages)

  return (
    <MessagesWrapper id="messages">
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
