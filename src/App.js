import React from 'react';
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { deviceType, browserName, mobileVendor, mobileModel, osVersion, isMobile } from "react-device-detect";

import * as nearlib from 'nearlib';
import * as nacl from "tweetnacl";

import Header from './components/header';
import Chat from './components/chat';
import Footer from './components/footer';

const MinAccountIdLen = 2;
const MaxAccountIdLen = 64;
const ValidAccountRe = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

const GasTransaction = 1000000000000000;

const accountKeyNamePrefix = "near_chat_account_key=";
const deviceKeyNamePrefix = "near_chat_device_key=";

const appTitle = 'NEAR Guest Book';
const ContractName = 'studio-vvs2k3876';

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
      deviceName: isMobile ? (
        deviceType + " " + mobileVendor + " " + mobileModel
      ) : (
        deviceType + " " + osVersion + " " + browserName
      ),
      messagesObj: null,
      sourcesObj: null,
    }
    // TODO put into this.state
    this.threadsMap = new Map()

    this.unauthorizedDeviceKey = null

    console.log(this.state.deviceName)
  }

  componentDidMount() {
    this._initNear()
  }

  accountKeyName() {
    return accountKeyNamePrefix + this._accountId
  }

  deviceKeyName() {
    return deviceKeyNamePrefix + this._accountId
  }

  async _initNear() {
    const nearConfig = {
      networkId: 'default',
      nodeUrl: 'https://rpc.nearprotocol.com',
      contractName: ContractName,
      walletUrl: 'https://wallet.nearprotocol.com',
    };
    const keyStore = new nearlib.keyStores.BrowserLocalStorageKeyStore();
    const near = await nearlib.connect(Object.assign({ deps: { keyStore } }, nearConfig));
    this._keyStore = keyStore;
    this._nearConfig = nearConfig;
    this._near = near;

    this._walletAccount = new nearlib.WalletAccount(this._near);
    this._accountId = this._walletAccount.getAccountId();

    this._contract = await this._near.loadContract(this._nearConfig.contractName, {
      viewMethods: [
        'getMessagesForThread',
        'getAllMessages',
        'getThreadName',
        'getMessagesForChannel',
        'getAllThreads',
        'accountKnown',
        'getAnyUnauthorizedDeviceKey',
        'getAccountPublicKey',
        'getEncryptedAccountKey',
      ],
      changeMethods: [
        'addMessage',
        'setThreadName',
        'registerDeviceAndAccountKey',
        'registerDeviceKey',
        'authorizeDeviceKey',
      ],
      sender: this._accountId,
    });
    this._prepareKeys();

    this.setState({
      connected: true,
      signedIn: !!this._accountId,
      accountId: this._accountId,
    });

    if (this.state.signedIn && !this._accountKey) {
      this._contract.accountKnown({account_id: this.state.accountId}).then(known_account => {
        console.log("KNOWN ACCOUNT!", known_account)
        if (!known_account) {
          this._processNewAccount().then(() => {
            this.reloadData();
          })
          .catch(console.error);
        } else {
          const deviceKey = this._deviceKey;
          console.log('REQUEST ACCESS FOR DEVICE KEY ', this.state.deviceName, Buffer.from(deviceKey.publicKey).toString('base64'), deviceKey.publicKey);
          this._contract.registerDeviceKey({
            device_name: this.state.deviceName,
            device_public_key: Buffer.from(deviceKey.publicKey).toString('base64'),
          }, GasTransaction).then(success => {
            console.log("NEW DEVICE KEY!", success)
          })
          .catch(console.error);
        }
      })
      .catch(console.error);
    }
    this.reloadData();
  }

  _prepareKeys() {
    let deviceKey = localStorage.getItem(this.deviceKeyName());
    if (deviceKey) {
      const buf = Buffer.from(deviceKey, 'base64');
      if (buf.length !== nacl.box.secretKeyLength) {
        throw new Error("Stored device key has wrong length");
      }
      deviceKey = nacl.box.keyPair.fromSecretKey(buf);
    } else {
      deviceKey = new nacl.box.keyPair();
      localStorage.setItem(this.deviceKeyName(), Buffer.from(deviceKey.secretKey).toString('base64'));
    }
    this._deviceKey = deviceKey;

    let accountKey = localStorage.getItem(this.accountKeyName());
    if (accountKey) {
      const buf = Buffer.from(accountKey, 'base64');
      if (buf.length !== nacl.box.secretKeyLength) {
        throw new Error("Stored account key has wrong length");
      }
      accountKey = nacl.box.keyPair.fromSecretKey(buf);
      this._accountKey = accountKey;
    } else {
      this._accountKey = null;
    }
  }

  async _processNewAccount() {
    const accountKey = new nacl.box.keyPair();
    localStorage.setItem(this.accountKeyName(), Buffer.from(accountKey.secretKey).toString('base64'));
    this._accountKey = accountKey

    const encrypted_account_key = this.encryptBox(
      Buffer.from(accountKey.secretKey).toString('base64'),
      accountKey.secretKey,
      this._deviceKey.publicKey
    )

    const success = await this._contract.registerDeviceAndAccountKey({
      device_name: this.state.deviceName,
      device_public_key: Buffer.from(this._deviceKey.publicKey).toString('base64'),
      account_public_key: Buffer.from(accountKey.publicKey).toString('base64'),
      encrypted_account_key,
    })
    console.log("NEW ACCOUNT!", success)
    if (!success) {
      throw new Error("Cannot create new account");
    }
  }

  isValidAccount(accountId) {
    return accountId.length >= MinAccountIdLen &&
        accountId.length <= MaxAccountIdLen &&
        accountId.match(ValidAccountRe);
  }

  async requestSignIn() {
    await this._walletAccount.requestSignIn(
        ContractName,
        appTitle
    )
  }

  async requestSignOut() {
    this._walletAccount.signOut()
    window.location.reload()
  }

  /**
  unbox encrypted messages with our secret key
  @param {string} msg64 encrypted message encoded as Base64
  @param {Uint8Array} mySecretKey the secret key to use to unbox the message
  @param {Uint8Array} theirPublicKey the public key to use to verify the message
  @return {string} decoded contents of the box
  */
  decryptBox(msg64, mySecretKey, theirPublicKey64) {
    console.log("DECRYPT: ", msg64, mySecretKey, theirPublicKey64);
    const theirPublicKey = Buffer.from(theirPublicKey64, 'base64');
    if (theirPublicKey.length !== nacl.box.publicKeyLength) {
      throw new Error("Given encryption public key is invalid");
    }
    const buf = Buffer.from(msg64, 'base64');
    const nonce = new Uint8Array(nacl.box.nonceLength);
    buf.copy(nonce, 0, 0, nonce.length);
    const box = new Uint8Array(buf.length - nacl.box.nonceLength);
    buf.copy(box, 0, nonce.length);
    const decodedBuf = nacl.box.open(box, nonce, theirPublicKey, mySecretKey);
    return Buffer.from(decodedBuf).toString()
  }

  /**
  box an unencrypted message with their public key and sign it with our secret key
  @param {string} str the message to wrap in a box
  @param {Uint8Array} mySecretKey the secret key to use to sign the message
  @param {Uint8Array} theirPublicKey the public key to use to encrypt the message
  @returns {string} base64 encoded box of incoming message
  */
  encryptBox(str, mySecretKey, theirPublicKey64) {
    console.log("ENCRYPT: ", str, mySecretKey, theirPublicKey64);
    const theirPublicKey = Buffer.from(theirPublicKey64, 'base64');
    if (theirPublicKey.length !== nacl.box.publicKeyLength) {
      throw new Error("Given encryption public key is invalid");
    }
    const buf = Buffer.from(str);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const box = nacl.box(buf, nonce, theirPublicKey, mySecretKey);

    const fullBuf = new Uint8Array(box.length + nacl.box.nonceLength);
    fullBuf.set(nonce);
    fullBuf.set(box, nacl.box.nonceLength);
    return Buffer.from(fullBuf).toString('base64')
  }

  // Submits a new message to the devnet
  submitMessage() {
    let text = document.getElementById('input').value;
    document.getElementById('input').value = '';
    // Calls the addMessage on the contract with arguments {text=text}.
    if (!!this.state.sourcesObj)
    this._contract.addMessage({
      channel: this.state.sourcesObj.state.currentChannel,
      thread_id: this.state.sourcesObj.state.currentThreadId ? this.state.sourcesObj.state.currentThreadId.toString() : "0",
      text}).catch(console.error);

    this.refreshMessages(text);
  }

  refreshMessages(pendingMsgText) {
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
  }

  refreshHeader() {
    ReactDOM.render(
      Header({app: this}),
      document.getElementById('header')
    );    
  }

  async authorizeDeviceKey() {
    let devicePublicKey = this.unauthorizedDeviceKey;
    let buf = new Buffer.from(devicePublicKey, 'base64');
    console.log('RECEIVED DEVICE PUBLIC KEY', buf);

    const encryptedAccountKey = this.encryptBox(
      Buffer.from(this._accountKey.secretKey).toString('base64'),
      this._accountKey.secretKey,
      buf
    );

    this._contract.authorizeDeviceKey({device_public_key: devicePublicKey, encrypted_account_key: encryptedAccountKey}, GasTransaction).then(success => {
      console.log("DEVICE AUTHORIZATION", success)
      if (!success) {
        throw new Error("Cannot authorize device key");
      }
      this.unauthorizedDeviceKey = null;
      this.reloadData()
    })
    .catch(console.error);
  }

  async createThread(message) {
    this._contract.setThreadName({'channel': message.channel, 'thread_id': message.message_id.toString(), 'name': 'Unnamed Thread'}).then(() => {
      console.log("THREAD CREATED", message);
      this.state.sourcesObj.setState({currentThreadId: message.message_id})
      this.reloadData()
    })
    .catch(console.error);
  }

  async renameThread(channel, threadId, newName) {
    this._contract.setThreadName({'channel': channel, 'thread_id': threadId.toString(), 'name': newName}).then(() => {
      console.log("THREAD RENAMED", newName, channel, threadId);
      this.reloadData()
    })
    .catch(console.error);
  }

  async reloadData() {
    if (this.state.connected) {
      if (this.state.signedIn) {
        if (this._accountKey) {
          this._contract.getAnyUnauthorizedDeviceKey({account_id: this.state.accountId}).then(deviceKey => {
            if (deviceKey !== "") {
              console.log("UNAUTHORIZED KEY FOUND", deviceKey)
              this.unauthorizedDeviceKey = deviceKey;
              this.refreshHeader();
            }
          })
          .catch(console.error);
        } else if (this._deviceKey) {
          this._contract.getEncryptedAccountKey({
            account_id: this.state.accountId,
            device_public_key: Buffer.from(this._deviceKey.publicKey).toString('base64'),
          }).then(encryptedAccountKey => {
            if (encryptedAccountKey !== "") {
              this._contract.getAccountPublicKey({account_id: this.state.accountId}).then(accountPublicKey => {
                accountPublicKey = Buffer.from(accountPublicKey, 'base64');
                let accountSecretKey = this.decryptBox(
                  encryptedAccountKey,
                  this._deviceKey.secretKey,
                  accountPublicKey
                )
                accountSecretKey = Buffer.from(accountSecretKey, 'base64');
                const accountKey = nacl.box.keyPair.fromSecretKey(accountSecretKey);
                localStorage.setItem(this.accountKeyName(), Buffer.from(accountKey.secretKey).toString('base64'));
                this._accountKey = accountKey
              })
              .catch(console.error);
            }
          })
          .catch(console.error);
        }
      }
      this._contract.getAllThreads({}).then(threads => {
        threads.forEach(thread => {
          this.threadsMap.set(thread.thread_id, thread)
        })
        this.state.sourcesObj.setState({threads: threads})
        this.refreshMessages();
        this.refreshHeader();
      })
      .catch(console.error);
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
