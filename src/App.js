import React from 'react';
import styled from "styled-components";

import NearChat from './contract'
import Header from './components/header';
import Chat from './components/chat';
import Footer from './components/footer';

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  height: 100vh;
  overflow: hidden;
`

const HeaderWrapper = styled.div`
  height: 50px;
  width: 100%;
  justify-content: space-between;
`

const ChatWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: flex-start;
  overflow: hidden;
`

const FooterWrapper = styled.div`
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

class App extends React.Component {
  constructor(props) {
    super(props);
    window.app = this

    this.state = {
      connected: false,
      signedIn: false,
      accountId: null,
      fullAccess: false,

      currentChannelId: null,
      currentThreadId: null,
      renamingThread: false,

      messagesObj: null,
      sourcesObj: null,
      headerObj: null,
      footerObj: null,
    }
    // TODO put into this.state
    this.channelsMap = new Map()
    this.threadsMap = new Map()

    // TODO remove it
    this.unauthorizedDeviceKey = null
  }

  componentDidMount() {
    this.nearChat = new NearChat()
    this.nearChat.initNear().then(() => {

      this.nearChat.initKeys();

      this.setState({
        connected: true,
        signedIn: !!this.nearChat.accountId,
        accountId: this.nearChat.accountId,
        fullAccess: !!this.nearChat.accountKey,
      });

      if (this.state.signedIn && !this.state.fullAccess) {
        this.nearChat.accountKnown().then(known_account => {
          console.log("KNOWN ACCOUNT!", known_account)
          if (!known_account) {
            this.nearChat.processNewAccount().then(() => {
              console.log("NEW ACCOUNT!")
              if (!!this.nearChat.accountKey) {
                this.setState({fullAccess: true})
              }
            })
            .catch(console.error);
          } else {
            this.nearChat.registerDeviceKey()
          }
        })
        .catch(console.error);
      }
    })
  }

  componentDidUpdate() {
    console.log("RELOAD DATA!", this.state)
    this.reloadData();
  }

  requestSignIn() {
    this.nearChat.signIn()
  }

  requestSignOut() {
    this.nearChat.signOut()
    window.location.reload()
  }

  submitMessage() {
    let text = document.getElementById('input').value;
    document.getElementById('input').value = '';
    if (!!this.state.sourcesObj)
      this.nearChat.addMessage(
        this.state.currentChannelId,
        this.state.currentThreadId,
        text
      ).then(() => {
        this.reloadData();
      })
      .catch(console.log);
    this.reloadMessages(text);
  }

  async authorizeDeviceKey() {
    const deviceKey = this.unauthorizedDeviceKey;
    this.unauthorizedDeviceKey = null;
    this.state.headerObj.forceUpdate();
    console.log('RECEIVED DEVICE PUBLIC KEY', deviceKey);
    this.nearChat.authorizeDeviceKey(deviceKey).then(success => {
      console.log("DEVICE AUTHORIZATION", success)
      if (!success) {
        throw new Error("Cannot authorize device key");
      }
    })
    .catch(console.error);
  }

  /*async createThread(message) {
    this._contract.setThreadName({'channel': message.channel, 'thread_id': message.message_id.toString(), 'name': 'Unnamed Thread'}).then(() => {
      console.log("THREAD CREATED", message);
      this.state.sourcesObj.setState({currentThreadId: message.message_id})
      this.reloadData()
    })
    .catch(console.error);
  }*/

  /*async renameThread(channel, threadId, newName) {
    this._contract.setThreadName({'channel': channel, 'thread_id': threadId.toString(), 'name': newName}).then(() => {
      console.log("THREAD RENAMED", newName, channel, threadId);
      this.reloadData()
    })
    .catch(console.error);
  }*/

  async reloadMessages(pendingMsgText) {
    const channelId = this.state.currentChannelId;
    const threadId = this.state.currentThreadId;
    // TODO
    if /*(pendingMsgText)*/ (false) {
      /*let pendingMsg = {
        'message_id': this.state.messages.length + 100,
        'channel': channel,
        'thread_id': !!thread ? thread.thread_id : 1000000,
        'sender': this.state.accountId,
        'text': pendingMsgText,
        'is_pending': true,
      };*/
      // TODO
      //this.state.messagesObj.appendMessage(pendingMsg)
      var element = document.getElementById('messages_frame');
      element.scrollTo(0,9999);
    } else {
      let promise;
      if (threadId !== null) {
        promise = this.nearChat.getMessagesForThread(channelId, threadId);
      } else if (channelId !== null) {
        promise = this.nearChat.getMessagesForChannel(channelId);
      } else {
        promise = this.nearChat.getAllMessages();
      }
    
      promise.then(messages => {
        this.state.messagesObj.updateMessages(messages)
        var element = document.getElementById('messages_frame');
        element.scrollTo(0,9999);
      })
      .catch(console.log);
    }
  }

  async reloadAccess() {
    if (this.state.connected && this.state.signedIn) {
      if (this.state.fullAccess) {
        this.nearChat.getAnyUnauthorizedDeviceKey().then(deviceKey => {
          if (deviceKey !== "") {
            console.log("UNAUTHORIZED KEY FOUND", deviceKey)
            this.unauthorizedDeviceKey = deviceKey;
            this.state.headerObj.forceUpdate();
          }
        })
        .catch(console.error);
      } else {
        await this.nearChat.upgradeToFullAccess();
        if (!!this.nearChat.accountKey) {
          this.setState({fullAccess: true})
        }
      }
    }    
  }

  async reloadData() {
    if (!this.state.connected) {
      // not ready to reload
      return;
    }
    this.reloadAccess()
    this.reloadMessages()
    if (this.state.connected) {
      const threads = await this.nearChat.getAllThreads();
      this.threadsMap.clear()
      threads.forEach(thread => {
        this.threadsMap.set(thread.thread_id, thread)
      })
      const channels = await this.nearChat.getChannels();
      this.channelsMap.clear()
      channels.forEach(channel => {
        this.channelsMap.set(channel.channel_id, channel)
      })
      // TODO remove
      this.state.sourcesObj.forceUpdate();
    }
  }

  render() {
    return (
        <AppWrapper>
          <HeaderWrapper>
            <Header app={this}/>
          </HeaderWrapper>
          <ChatWrapper>
            <Chat app={this}/>
          </ChatWrapper>
          <FooterWrapper>
            <Footer app={this}/>
          </FooterWrapper>
        </AppWrapper>
    );
  }
}

export default App;