import React from 'react';
import ReactDOM from 'react-dom';
import styled from "styled-components";
import { deviceType, browserName, mobileVendor, mobileModel, osVersion, isMobile } from "react-device-detect";

import * as nearlib from 'nearlib';
import * as nacl from "tweetnacl";

import { theme } from './theme';
import Header from './components/header';
import Chat from './components/chat';
import Messages from './components/messages';
import Footer from './components/footer';
import Sources from './components/sources';

const MinAccountIdLen = 2;
const MaxAccountIdLen = 64;
const ValidAccountRe = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

const GasTransaction = 1000000000000000;

const accountKeyName = "near_chat_account_key  test";
const deviceKeyName = "near_chat_device_key  test";

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
      hasAccountKey: false,
      deviceName: isMobile ? (
        deviceType + " " + mobileVendor + " " + mobileModel
      ) : (
        deviceType + " " + osVersion + " " + browserName
      ),
    }
    this.unauthorizedDeviceKey = null
    window.messages = []
    window.channel = null
    window.threadId = 0
    window.pendingMsg = null
    window.threads = new Map()

    console.log(this.state.deviceName)
  }

  componentDidMount() {
    this._initNear()
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
      hasAccountKey: !!this._accountKey,
    });

    if (this.state.signedIn && !this.state.hasAccountKey) {
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
            /*if (!success) {
              throw new Error("Cannot register new device key");
            }*/
          })
          .catch(console.error);
        }
      })
      .catch(console.error);
    }
    this.reloadData();
  }

  _prepareKeys() {
    let deviceKey = localStorage.getItem(deviceKeyName);
    if (deviceKey) {
      const buf = Buffer.from(deviceKey, 'base64');
      if (buf.length !== nacl.box.secretKeyLength) {
        throw new Error("Stored device key has wrong length");
      }
      deviceKey = nacl.box.keyPair.fromSecretKey(buf);
    } else {
      deviceKey = new nacl.box.keyPair();
      localStorage.setItem(deviceKeyName, Buffer.from(deviceKey.secretKey).toString('base64'));
    }
    this._deviceKey = deviceKey;

    let accountKey = localStorage.getItem(accountKeyName);
    if (accountKey) {
      const buf = Buffer.from(accountKey, 'base64');
      if (buf.length !== nacl.box.secretKeyLength) {
        throw new Error("Stored account key has wrong length");
      }
      accountKey = nacl.box.keyPair.fromSecretKey(buf);
      this._accountKey = accountKey;
    }
  }

  async _processNewAccount() {
    const accountKey = new nacl.box.keyPair();
    localStorage.setItem(accountKeyName, Buffer.from(accountKey.secretKey).toString('base64'));
    const deviceKey = new nacl.box.keyPair();
    localStorage.setItem(deviceKeyName, Buffer.from(deviceKey.secretKey).toString('base64'));

    /*const buf = Buffer.from(accountKey.secretKey);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const box = nacl.box(buf, nonce, deviceKey.publicKey, deviceKey.secretKey);

    const fullBuf = new Uint8Array(box.length + nacl.box.nonceLength);
    fullBuf.set(nonce);
    fullBuf.set(box, nacl.box.nonceLength);
    const encrypted_account_key = Buffer.from(fullBuf).toString('base64')*/

    const encrypted_account_key = this.encryptBox(
      Buffer.from(accountKey.secretKey).toString('base64'),
      accountKey.secretKey,
      deviceKey.publicKey
    )

    this._deviceKey = deviceKey
    this._accountKey = accountKey

    console.log(this.state.deviceName)
    const success = await this._contract.registerDeviceAndAccountKey({
      device_name: this.state.deviceName,
      device_public_key: Buffer.from(deviceKey.publicKey).toString('base64'),
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
      throw new Error("Given encryption public key is invalid.");
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
      throw new Error("Given encryption public key is invalid.");
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
    console.log(this._contract);
    // Calls the addMessage on the contract with arguments {text=text}.
    this._contract.addMessage({channel: window.channel, thread_id: window.threadId.toString(), text}).catch(console.error);

    window.pendingMsg = {
      'message_id': 1000000,
      'channel': window.channel,
      'thread_id': window.threadId ? window.threadId : 1000000,
      'sender': this.state.accountId,
      'text': text
    };
    this.refreshMessages();
  }

  refreshMessages() {
    // If we already have a timeout scheduled, cancel it
    /*console.log(this);
    console.log(this.state);
      console.log(this.state.refreshTimeout);
    if (this.state.refreshTimeout) {
      console.log(this);
      console.log(this.state);
      console.log(this.state.refreshTimeout);
      clearTimeout(this.state.refreshTimeout);
      //this.setState({refreshTimeout: null});
    }*/
    // Schedules a new timeout
    //this.setState({refreshTimeout: setTimeout(this.refreshMessages, 1000)});
    // Checking if the page is not active and exits without requesting messages from the chain
    // to avoid unnecessary queries to the devnet.
    /*if (document.hidden) {
      return;
    }*/
    // Adding animation UI
    //$('#refresh-span').addClass(animateClass);
    // Calling the contract to read messages which makes a call to devnet.
    // The read call works even if the Account ID is not provided.
    if (window.pendingMsg != null) {
      window.messages.push(window.pendingMsg);
      window.pendingMsg = null;
      console.log('HERE0');
      ReactDOM.render(
        Messages(this),
        document.getElementById('messages')
      );
      console.log('HERE000');
      var element = document.getElementById('messages_frame');
      element.scrollTo(0,9999);
    } else {
      let promise;
      if (window.threadId !== 0) {
        console.log('HERE1');
        promise = this._contract.getMessagesForThread({'channel': window.channel, 'thread_id': window.threadId.toString()});
      } else if (window.channel != null) {
        console.log('HERE2');
        console.log(window.channel);
        promise = this._contract.getMessagesForChannel({'channel': window.channel});
      } else {
        console.log(this);
        console.log('HERE3');
        console.log(this._contract);
        promise = this._contract.getAllMessages({});
      }
    
      promise.then(messages => {
        console.log(messages);
        window.messages = messages;
        console.log(window.threads);
        ReactDOM.render(
          Messages(this),
          document.getElementById('messages')
        );
        var element = document.getElementById('messages_frame');
        element.scrollTo(0,9999);
      })
      .catch(console.log);
    }
  }

  updateChannelThread(channel, threadId) {
    console.log(channel);
    window.channel = channel;
    window.threadId = threadId;
    window.pendingMsg = null;
    this.reloadData();
  }

  refreshSources() {
    ReactDOM.render(
      Sources(this),
      document.getElementById('sources')
    );    
  }

  refreshHeader() {
    ReactDOM.render(
      Header({app: this}),
      document.getElementById('header')
    );    
  }

  async authorizeDeviceKey() {
    let devicePublicKey = this.unauthorizedDeviceKey;
    console.log('AAAA', devicePublicKey, this._deviceKey.publicKey);
    let buf = new Buffer.from(devicePublicKey, 'base64');
    console.log('AAAA', buf, this._deviceKey.publicKey);

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

  reloadData() {
    if (this.state.connected) {
      if (this.state.signedIn) {
        if (this.state.hasAccountKey) {
          console.log("OLOLO", this._accountKey.secretKey, this._accountKey.publicKey, "OLOLO");
          this._contract.getAnyUnauthorizedDeviceKey({account_id: this.state.accountId}).then(deviceKey => {
            if (deviceKey !== "") {
              console.log("##############", deviceKey)
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
                // TODO
                accountPublicKey = Buffer.from(accountPublicKey, 'base64');
                console.log("OLOLO1==", encryptedAccountKey, accountPublicKey);
                let accountSecretKey = this.decryptBox(
                  encryptedAccountKey,
                  this._deviceKey.secretKey,
                  accountPublicKey
                )
                accountSecretKey = Buffer.from(accountSecretKey, 'base64');
                console.log("OLOLO1", accountSecretKey, accountPublicKey);
                const accountKey = nacl.box.keyPair.fromSecretKey(accountSecretKey);
                console.log("OLOLO2", accountKey.secretKey, accountKey.publicKey);
                // TODO make sure and and save
                //this._accountKey = accountKey
                //this.setState({hasAccountKey: true})
              })
              .catch(console.error);
            }
          })
          .catch(console.error);
        }
      }
      this._contract.getAllThreads({}).then(threads => {
        threads.forEach(thread => {
          if (!window.threads.get(thread.thread_id)) {
            window.threads.set(thread.thread_id, thread)
          }
        })
        console.log("HERE!!!");
        this.refreshMessages();
        this.refreshSources();
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
