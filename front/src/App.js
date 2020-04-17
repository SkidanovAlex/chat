import React from 'react';
import styled from "styled-components";

import * as nearlib from 'nearlib';
import * as nacl from "tweetnacl";

import { theme } from './theme';
import Header from './components/header';

const MinAccountIdLen = 2;
const MaxAccountIdLen = 64;
const ValidAccountRe = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

const appTitle = 'NEAR Guest Book';
const ContractName = 'studio-vvs2k3876';

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  height: 100vh;
`

const HeaderWrapper = styled.div`
  ${theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  flex: 1;
  overflow: auto;
`

const FooterWrapper = styled.div`
  width: 100%;
  min-height: 30px;
  align-self: flex-end;
`

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      connected: false,
      signedIn: false,
      accountId: null,
      receiverId: "",
      receiversKey: null,
      accountLoading: false,
    };

    this._parseEncryptionKey()
    this._initNear().then(() => {
      this.setState({
        connected: true,
        signedIn: !!this._accountId,
        accountId: this._accountId,
      })
    })
  }

  _parseEncryptionKey() {
    const keyKey = "enc_key:";
    let key = localStorage.getItem(keyKey);
    if (key) {
      const buf = Buffer.from(key, 'base64');
      if (buf.length !== nacl.box.secretKeyLength) {
        throw new Error("Given secret key has wrong length");
      }
      key = nacl.box.keyPair.fromSecretKey(buf);
    } else {
      key = new nacl.box.keyPair();
      localStorage.setItem(keyKey, Buffer.from(key.secretKey).toString('base64'));
    }
    this._key = key;
  }

  async _updateEncryptionPublicKey() {
    const key = Buffer.from(this._key.publicKey).toString('base64');

    // TODO MOO
    /*const currentKey = await this._contract.get_key({account_id: this._accountId});
    if (currentKey !== key) {
      console.log(`Updating public encryption key to ${key}`);
      await this._contract.set_key({key});
    } else {
      console.log(`Current public encryption key is up to date: ${key}`);
    }*/
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

    if (!!this._accountId) {
      this._contract = await this._near.loadContract(this._nearConfig.contractName, {
        viewMethods: ['getMessagesForThread', 'getAllMessages', 'getThreadName', 'getMessagesForChannel', 'getAllThreads', 'getKey'],
        changeMethods: ['addMessage', 'setThreadName', 'setKey'],
        sender: this._accountId,
      });
      await this._updateEncryptionPublicKey();
    }
  }

  handleChange(key, value) {
    const stateChange = {
      [key]: value,
    };
    if (key === 'receiverId') {
      value = value.toLowerCase().replace(/[^a-z0-9\-_.]/, '');
      stateChange[key] = value;
      stateChange.receiversKey = null;
      if (this.isValidAccount(value)) {
        stateChange.accountLoading = true;
        this._contract.getKey({account_id: value}).then((receiversKey) => {
          if (this.state.receiverId === value) {
            this.setState({
              accountLoading: false,
              receiversKey,
            })
          }
        }).catch((e) => {
          if (this.state.receiverId === value) {
            this.setState({
              accountLoading: false,
            })
          }
        })
      }
    }
    this.setState(stateChange);
  }

  isValidAccount(accountId) {
    return accountId.length >= MinAccountIdLen &&
        accountId.length <= MaxAccountIdLen &&
        accountId.match(ValidAccountRe);
  }

  receiverClass() {
    if (!this.state.receiverId || (this.isValidAccount(this.state.receiverId) && this.state.accountLoading)) {
      return "form-control form-control-large";
    } else if (this.isValidAccount(this.state.receiverId) && this.state.receiversKey) {
      return "form-control form-control-large is-valid";
    } else {
      return "form-control form-control-large is-invalid";
    }
  }

  async requestSignIn() {
    await this._walletAccount.requestSignIn(
        ContractName,
        appTitle
    )
  }

  /**
  unbox encrypted messages with our secret key
  @param {string} msg64 encrypted message encoded as Base64
  @param {Uint8Array} theirPublicKey the public key to use to verify the message
  @return {string} decoded contents of the box
  */
  decryptBox(msg64, theirPublicKey64) {
    const theirPublicKey = Buffer.from(theirPublicKey64, 'base64');
    if (theirPublicKey.length !== nacl.box.publicKeyLength) {
      throw new Error("Given encryption public key is invalid.");
    }
    const buf = Buffer.from(msg64, 'base64');
    const nonce = new Uint8Array(nacl.box.nonceLength);
    buf.copy(nonce, 0, 0, nonce.length);
    const box = new Uint8Array(buf.length - nacl.box.nonceLength);
    buf.copy(box, 0, nonce.length);
    const decodedBuf = nacl.box.open(box, nonce, theirPublicKey, this._key.secretKey);
    return Buffer.from(decodedBuf).toString()
  }

  /**
  box an unencrypted message with their public key and sign it with our secret key
  @param {string} str the message to wrap in a box
  @param {Uint8Array} theirPublicKey the public key to use to encrypt the message
  @returns {string} base64 encoded box of incoming message
  */
  encryptBox(str, theirPublicKey64) {
    const theirPublicKey = Buffer.from(theirPublicKey64, 'base64');
    if (theirPublicKey.length !== nacl.box.publicKeyLength) {
      throw new Error("Given encryption public key is invalid.");
    }
    const buf = Buffer.from(str);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const box = nacl.box(buf, nonce, theirPublicKey, this._key.secretKey);

    const fullBuf = new Uint8Array(box.length + nacl.box.nonceLength);
    fullBuf.set(nonce);
    fullBuf.set(box, nacl.box.nonceLength);
    return Buffer.from(fullBuf).toString('base64')
  }

  render() {
    return (
        <AppWrapper>
          <HeaderWrapper>
            <Header connected={this.state.connected} signedIn={this.state.signedIn} app={this}/>
          </HeaderWrapper>
          <BodyWrapper>
            {/*<Body />*/}
          </BodyWrapper>
          <FooterWrapper>
            {/*<Footer />*/}
          </FooterWrapper>
        </AppWrapper>
    );
  }
}

export default App;
