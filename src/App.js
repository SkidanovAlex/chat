import React from 'react';
import ReactDOM from 'react-dom';
import styled from "styled-components";

import Contract from './contract'
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
      messagesObj: null,
      sourcesObj: null,
      footerObj: null,
    }
    // TODO put into this.state
    this.threadsMap = new Map()

    this.unauthorizedDeviceKey = null
  }

  componentDidMount() {
    this.contract = new Contract()
    this.contract.initNear().then(() => {

      this.contract.initKeys();

      this.setState({
        connected: true,
        signedIn: !!this.contract.accountId,
        accountId: this.contract.accountId,
        fullAccess: !!this.contract.accountKey,
      });

      if (this.state.signedIn && !this.state.fullAccess) {
        this.contract.accountKnown().then(known_account => {
          console.log("KNOWN ACCOUNT!", known_account)
          if (!known_account) {
            this.contract.processNewAccount().then(() => {
              console.log("NEW ACCOUNT!")
              if (!!this.contract.accountKey) {
                this.setState({fullAccess: true})
              }
            })
            .catch(console.error);
          } else {
            this.contract.registerDeviceKey()
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
    this.contract.signIn()
  }

  requestSignOut() {
    this.contract.signOut()
    window.location.reload()
  }

  // Submits a new message to the devnet
  /*submitMessage() {
    let text = document.getElementById('input').value;
    document.getElementById('input').value = '';
    // Calls the addMessage on the contract with arguments {text=text}.
    if (!!this.state.sourcesObj)
      this._contract.addMessage({
        channel: this.state.sourcesObj.state.currentChannel,
        thread_id: this.state.sourcesObj.state.currentThreadId ? this.state.sourcesObj.state.currentThreadId.toString() : "0",
        text
      })
      .catch(console.error);

    this.refreshMessages(text);
  }*/

  /*refreshMessages(pendingMsgText) {
    const channel = this.state.sourcesObj.state.currentChannel;
    const threadId = this.state.sourcesObj.state.currentThreadId;
    const thread = this.threadsMap.get(threadId);
    if (pendingMsgText) {
      let pendingMsg = {
        'message_id': this.state.messagesObj.state.messages.length + 100,
        'channel': channel,
        'thread_id': !!thread ? thread.thread_id : 1000000,
        'sender': this.state.accountId,
        'text': pendingMsgText,
        'is_pending': true,
      };
      this.state.messagesObj.appendMessage(pendingMsg)
      var element = document.getElementById('messages_frame');
      element.scrollTo(0,9999);
    } else {
      let promise;
      if (!!thread) {
        console.log(thread)
        promise = this._contract.getMessagesForThread({'channel': channel, 'thread_id': thread.thread_id.toString()});
      } else if (channel != null) {
        promise = this._contract.getMessagesForChannel({'channel': channel});
      } else {
        promise = this._contract.getAllMessages({});
      }
    
      promise.then(messages => {
        this.state.messagesObj.updateMessages(messages)
        var element = document.getElementById('messages_frame');
        element.scrollTo(0,9999);
      })
      .catch(console.log);
    }
  }*/

  refreshHeader() {
    ReactDOM.render(
      Header({app: this}),
      document.getElementById('header')
    );    
  }

  async authorizeDeviceKey() {
    const deviceKey = this.unauthorizedDeviceKey;
    this.unauthorizedDeviceKey = null;
    this.refreshHeader();
    console.log('RECEIVED DEVICE PUBLIC KEY', deviceKey);
    this.contract.authorizeDeviceKey(deviceKey).then(success => {
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

  async reloadAccess() {
    if (this.state.connected && this.state.signedIn) {
      if (this.state.fullAccess) {
        this.contract.getAnyUnauthorizedDeviceKey().then(deviceKey => {
          if (deviceKey !== "") {
            console.log("UNAUTHORIZED KEY FOUND", deviceKey)
            this.unauthorizedDeviceKey = deviceKey;
            this.refreshHeader();
          }
        })
        .catch(console.error);
      } else {
        console.log("HERE?", this.state.fullAccess)
        await this.contract.upgradeToFullAccess();
        console.log("UPGRADED?")
        if (!!this.contract.accountKey) {
          this.setState({fullAccess: true})
        }
      }
    }    
  }

  async reloadData() {
    this.reloadAccess()
    this.refreshHeader()
    /*if (this.state.connected) {
      if (this.state.signedIn) {
        if (this.state.fullAccess) {
          this.contract.getAnyUnauthorizedDeviceKey().then(deviceKey => {
            if (deviceKey !== "") {
              console.log("UNAUTHORIZED KEY FOUND", deviceKey)
              this.unauthorizedDeviceKey = deviceKey;
              this.refreshHeader();
            }
          })
          .catch(console.error);
        } else {
          this.contract.upgradeToFullAccess().then(success => {
            this.setState({fullAccess: success});
          })
        }
      }
      this._contract.getAllThreads({}).then(threads => {
        console.log('THREADS', threads)
        threads.forEach(thread => {
          this.threadsMap.set(thread.thread_id, thread)
        })
        this.state.sourcesObj.setState({threads: threads});
        this.state.footerObj.resetSendStatus();
        this.refreshMessages();
        this.refreshHeader();
      })
      .catch(console.error);
    }*/
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