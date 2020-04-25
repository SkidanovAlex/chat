// TODO this module can be divided into {NEAR interactions, local storage interactions}

import { deviceType, browserName, mobileVendor, mobileModel, osVersion, isMobile } from "react-device-detect";

import * as nearlib from 'nearlib';
import * as nacl from "tweetnacl";

const ContractName = 'studio-vvs2k3876';
const AppTitle = 'NEAR Guest Book';
const AccountKeyNamePrefix = "near_chat_account_key test123456789";
const DeviceKeyNamePrefix = "near_chat_device_key test123456789";
const GasTransaction = 1000000000000000;
const MinAccountIdLen = 2;
const MaxAccountIdLen = 64;
const ValidAccountRe = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

class NearChat {
  constructor() {
    console.log("CONSTRUCT THE CONTRACT")
  }

  async initNear() {
    const nearConfig = {
      networkId: 'default',
      nodeUrl: 'https://rpc.nearprotocol.com',
      contractName: ContractName,
      walletUrl: 'https://wallet.nearprotocol.com',
    };
    const keyStore = new nearlib.keyStores.BrowserLocalStorageKeyStore();
    const near = await nearlib.connect(Object.assign({ deps: { keyStore } }, nearConfig));
    this.keyStore = keyStore;
    this.nearConfig = nearConfig;
    this.near = near;

    this.walletAccount = new nearlib.WalletAccount(this.near);
    this.accountId = this.walletAccount.getAccountId();

    this.contract = await this.near.loadContract(ContractName, {
      viewMethods: [
        'getMessagesForThread',
        'getMessagesForChannel',
        'getAllMessages',
        'getThreadName',
        'getAllThreads',
        'accountKnown',
        'getAnyUnauthorizedDeviceKey',
        'getAccountPublicKey',
        'getEncryptedAccountKey',
        'getChannels',
        'getChannel',
      ],
      changeMethods: [
        'addMessage', // thread_id == "0" for new threads
        'setThreadName',
        'createPublicChannel',
        'createPrivateChannel',
        'registerDeviceAndAccountKey',
        'registerDeviceKey',
        'authorizeDeviceKey',
      ],
      sender: this.accountId,
    });
  }

  async signIn() {
    this.walletAccount.requestSignIn(
      ContractName,
      AppTitle
    )
  }

  async signOut() {
    this.walletAccount.signOut()
  }

  getDeviceName() {
    return isMobile ? (
      deviceType + " " + mobileVendor + " " + mobileModel
    ) : (
      deviceType + " " + osVersion + " " + browserName
    )
  }

  deviceKeyName() {
    return DeviceKeyNamePrefix + this.accountId
  }

  accountKeyName() {
    return AccountKeyNamePrefix + this.accountId
  }

  isValidAccount(accountId) {
    return accountId.length >= MinAccountIdLen &&
        accountId.length <= MaxAccountIdLen &&
        accountId.match(ValidAccountRe);
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

  initKeys() {
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
    this.deviceKey = deviceKey;

    let accountKey = localStorage.getItem(this.accountKeyName());
    if (accountKey) {
      const buf = Buffer.from(accountKey, 'base64');
      if (buf.length !== nacl.box.secretKeyLength) {
        throw new Error("Stored account key has wrong length");
      }
      accountKey = nacl.box.keyPair.fromSecretKey(buf);
      this.accountKey = accountKey;
    } else {
      this.accountKey = null;
    }
  }

  async processNewAccount() {
    const accountKey = new nacl.box.keyPair();
    localStorage.setItem(this.accountKeyName(), Buffer.from(accountKey.secretKey).toString('base64'));
    this.accountKey = accountKey

    const encryptedAccountKey = this.encryptBox(
      Buffer.from(accountKey.secretKey).toString('base64'),
      accountKey.secretKey,
      this.deviceKey.publicKey
    )

    console.log('calling registerDeviceAndAccountKey',
                this.getDeviceName(),
                Buffer.from(this.deviceKey.publicKey).toString('base64'),
                Buffer.from(this.accountKey.publicKey).toString('base64'),
                encryptedAccountKey);
    const success = await this.contract.registerDeviceAndAccountKey({
      device_name: this.getDeviceName(),
      device_public_key: Buffer.from(this.deviceKey.publicKey).toString('base64'),
      account_public_key: Buffer.from(this.accountKey.publicKey).toString('base64'),
      encrypted_account_key: encryptedAccountKey,
    })
    if (!success) {
      throw new Error("Cannot create new account");
    }
  }

  async accountKnown() {
    return this.contract.accountKnown({account_id: this.accountId})
  }

  async registerDeviceKey() {
    console.log('REQUEST ACCESS FOR DEVICE KEY ', this.getDeviceName());
    return this.contract.registerDeviceKey({
      device_name: this.getDeviceName(),
      device_public_key: Buffer.from(this.deviceKey.publicKey).toString('base64'),
    }, GasTransaction)
  }

  async authorizeDeviceKey(devicePublicKey) {
    let buf = new Buffer.from(devicePublicKey, 'base64');

    const encryptedAccountKey = this.encryptBox(
      Buffer.from(this.accountKey.secretKey).toString('base64'),
      this.accountKey.secretKey,
      buf
    );

    return this.contract.authorizeDeviceKey({device_public_key: devicePublicKey, encrypted_account_key: encryptedAccountKey}, GasTransaction)
  }

  async getAnyUnauthorizedDeviceKey() {
    return this.contract.getAnyUnauthorizedDeviceKey({account_id: this.accountId})
  }

  async upgradeToFullAccess() {
    const encryptedAccountKey = await this.contract.getEncryptedAccountKey({
      account_id: this.accountId,
      device_public_key: Buffer.from(this.deviceKey.publicKey).toString('base64'),
    })
    console.log("AAA", encryptedAccountKey);
    if (encryptedAccountKey !== "") {
      let accountPublicKey = await this.contract.getAccountPublicKey({account_id: this.accountId});
      accountPublicKey = Buffer.from(accountPublicKey, 'base64');
      let accountSecretKey = this.decryptBox(
        encryptedAccountKey,
        this.deviceKey.secretKey,
        accountPublicKey
      )
      accountSecretKey = Buffer.from(accountSecretKey, 'base64');
      const accountKey = nacl.box.keyPair.fromSecretKey(accountSecretKey);
      localStorage.setItem(this.accountKeyName(), Buffer.from(accountKey.secretKey).toString('base64'));
      this.accountKey = accountKey
      console.log("ACCOUNT KEY ADDED");
    }
  }

  async getAllThreads() {
    return this.contract.getAllThreads({})
  }

  async getChannels() {
    return this.contract.getChannels({account_id: this.accountId})
  }

  async createPublicChannel(channelName) {
    return this.contract.createPublicChannel({channel_name: channelName})
  }

  // TODO use message_key_id
  async addMessage(channelId, threadId, text) {
    return this.contract.addMessage({
      channel_id: channelId,
      thread_id: threadId == null ? "0" : threadId.toString(),
      message_key_id: "0",
      text,
    })
  }

  async getAllMessages() {
    return this.contract.getAllMessages({})
  }

  async getMessagesForChannel(channelId) {
    console.log("!!!", channelId)
    return this.contract.getMessagesForChannel({channel_id: channelId})
  }

  async getMessagesForThread(threadId) {
    return this.contract.getMessagesForChannel({thread_id: threadId.toString()})
  }
}

export default NearChat;