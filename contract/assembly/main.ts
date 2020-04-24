// @nearfile
import { context, logging, PersistentVector, PersistentMap } from "near-sdk-as";
import { PostedMessage, Thread, DeviceKey, getChannelCollectionName, getThreadCollectionName, getDeviceKeysCollectionName, getCollectionName, getSecretKeysVectorName, getSecretKeysMapName, getChannelsVectorName, Channel, ChannelNameIdAndKey, RetrievedMessage, ChannelNameIdAndKey } from './model';

function getChannelsCollection(): PersistentVector<Channel> {
  let all_channels = new PersistentVector<Channel>(getCollectionName("all_channels"));

  if (all_channels.length == 0) {
    createPublicChannel("General");
    createPublicChannel("DevX");
    createPublicChannel("Staking");
  }

  return all_channels;
}

export function addMessage(channel: u32, thread_id: u64, message_key_id: u32, text: string): void {
  let allMessages = new PersistentVector<PostedMessage>(getCollectionName("messages"));
  let msg_id = allMessages.length;

  if (thread_id == 0) {
    thread_id = msg_id;
  }

  let message = new PostedMessage(msg_id, context.sender, text, thread_id, message_key_id, channel);
  let thread  = new Thread(channel, thread_id, text);

  allMessages.push(message);

  if (thread_id == msg_id) {
    let threads = new PersistentMap<u64, Thread>(getCollectionName("threads"));
    threads.set(thread_id, thread);
  }

  let channelMessageIds = new PersistentVector<u32>(getChannelCollectionName(channel));
  channelMessageIds.push(msg_id);

  let threadMessageIds = new PersistentVector<u32>(getThreadCollectionName(thread_id));
  threadMessageIds.push(msg_id);
}

function annotateMessage(message: PostedMessage): RetrievedMessage {
  let threads = new PersistentMap<u64, Thread>(getCollectionName("threads"));
  let all_channels = getChannelsCollection();

  let encrypted_message_secret_keys = new PersistentMap<u32, string>(getSecretKeysMapName(message.sender));

  let thread_text = threads.contains(message.thread_id) ? threads.get(message.thread_id)!.name : "";
  let channel_name = (message.channel_id < (all_channels.length as u32)) ? all_channels[message.channel_id].channel_name : "";

  let message_text = message.text;
  let message_key = "";

  if (message.message_key_id != 0) {
    if (encrypted_message_secret_keys.contains(message.message_key_id)) {
      message_key = encrypted_message_secret_keys.get(message.message_key_id)!;
    } else {
      message_text = "(Failed to decrypt: channel key unknown)";
    }
  }

  return new RetrievedMessage(
    message.message_id,
    message.sender,
    message_text,
    message.thread_id,
    thread_text,
    message.message_key_id,
    message_key,
    message.channel_id,
    channel_name,
  )
}

export function getMessagesForThread(channel: u32, thread_id: u64): Array<RetrievedMessage> {
  let allMessages = new PersistentVector<PostedMessage>(getCollectionName("messages"));
  let threadMessageIds = new PersistentVector<u32>(getThreadCollectionName(thread_id));

  let ret = new Array<RetrievedMessage>();
  
  for (let i = 0; i < threadMessageIds.length; ++i) {
    let posted_message = allMessages[threadMessageIds[i]];
    ret.push(annotateMessage(posted_message));
  }
  return ret;
}

export function getMessagesForChannel(channel: u32): Array<RetrievedMessage> {
  let allMessages = new PersistentVector<PostedMessage>(getCollectionName("messages"));
  let channelMessageIds = new PersistentVector<u32>(getChannelCollectionName(channel));

  let ret = new Array<RetrievedMessage>();
  
  for (let i = 0; i < channelMessageIds.length; ++i) {
    let posted_message = allMessages[channelMessageIds[i]];
    ret.push(annotateMessage(posted_message));
  }
  return ret;
}

export function getAllMessages(): Array<RetrievedMessage> {
  let allMessages = new PersistentVector<PostedMessage>(getCollectionName("messages"));

  let ret = new Array<RetrievedMessage>();
  
  for (let i = 0; i < allMessages.length; ++ i) {
    ret.push(annotateMessage(allMessages[i]));
  }
  return ret;
}

export function getThreadName(thread_id: u64): String {
  let threads = new PersistentMap<u64, Thread>(getCollectionName("threads"));
  return threads.get(thread_id)!.name;
}

export function setThreadName(channel: u32, thread_id: u64, name: string): void {
  let thread = new Thread(channel, thread_id, '!' + name);
  let threads = new PersistentMap<u64, Thread>(getCollectionName("threads"));
  let allThreadIds = new PersistentVector<u64>(getCollectionName("all_named_threads"));

  let existingThread = threads.get(thread_id)!;
  if (!existingThread.name.startsWith("!")) {
    allThreadIds.push(thread_id);
  }
  threads.set(thread_id, thread);
}

export function getAllThreads(): Array<Thread> {
  let threads = new PersistentMap<u64, Thread>(getCollectionName("threads"));
  let allThreadIds = new PersistentVector<u64>(getCollectionName("all_named_threads"));

  let ret = new Array<Thread>();

  for (let i = 0; i < allThreadIds.length; ++ i) {
    ret.push(threads.get(allThreadIds[i])!);
  }
  return ret;
}

export function accountKnown(account_id: string): boolean {
  let account_keys = new PersistentMap<string, string>(getCollectionName("account_keys"));
  
  return account_keys.contains(account_id);
}

export function registerDeviceAndAccountKey(device_name: string, device_public_key: string, account_public_key: string, encrypted_account_key: string): boolean {
  let account_keys = new PersistentMap<string, string>(getCollectionName("account_keys"));

  if (account_keys.contains(context.sender)) {
    return false;
  }

  let my_device_keys = new PersistentVector<DeviceKey>(getDeviceKeysCollectionName(context.sender));

  if (my_device_keys.length > 0) {
    // Only the first device can set the account key
    return false;
  }

  account_keys.set(context.sender, account_public_key);

  let device_key = new DeviceKey(device_name, device_public_key, encrypted_account_key);
  my_device_keys.push(device_key);
  return true;
}

export function registerDeviceKey(device_name: string, device_public_key: string): boolean {
  let my_device_keys = new PersistentVector<DeviceKey>(getDeviceKeysCollectionName(context.sender));

  if (my_device_keys.length == 0) {
    // The first device key must be added via `registerDeviceAndAccountKey`
    return false;
  }

  for (let i = 0; i < my_device_keys.length; ++ i) {
    let device_key = my_device_keys[i];
    if (device_key.device_public_key == device_public_key) {
      // device key is already added
      return false;
    }
  }

  let device_key = new DeviceKey(device_name, device_public_key, "");
  my_device_keys.push(device_key);
  return true;
}

export function getAnyUnauthorizedDeviceKey(account_id: string): String {
  let my_device_keys = new PersistentVector<DeviceKey>(getDeviceKeysCollectionName(account_id));

  for (let i = 0; i < my_device_keys.length; ++ i) {
    let device_key = my_device_keys[i];
    if (device_key.encrypted_account_key == "") {
      return device_key.device_public_key;
    }
  }

  return "";
}

export function authorizeDeviceKey(device_public_key: string, encrypted_account_key: string): boolean {
  let my_device_keys = new PersistentVector<DeviceKey>(getDeviceKeysCollectionName(context.sender));

  for (let i = 0; i < my_device_keys.length; ++ i) {
    let device_key = my_device_keys[i];
    if (device_key.device_public_key == device_public_key) {
      device_key.encrypted_account_key = encrypted_account_key;
      my_device_keys[i] = device_key;
      return true;
    }
  }

  return false;
}

export function getAccountPublicKey(account_id: string): String {
  let account_keys = new PersistentMap<string, string>(getCollectionName("account_keys"));

  let account_key = account_keys.get(account_id)!;
  return account_key;
}

export function getEncryptedAccountKey(account_id: string, device_public_key: string): String {
  let my_device_keys = new PersistentVector<DeviceKey>(getDeviceKeysCollectionName(account_id));

  for (let i = 0; i < my_device_keys.length; ++ i) {
    let device_key = my_device_keys[i];
    if (device_key.device_public_key == device_public_key) {
      return device_key.encrypted_account_key;
    }
  }
  return "";
}

export function createPublicChannel(channel_name: string): boolean {
  let all_channels = new PersistentVector<Channel>(getCollectionName("all_channels"));

  let channel_id = all_channels.length;

  all_channels.push(new Channel(channel_name, new Array<string>(), 0));

  return true;
}

export function createPrivateChannel(channel_name: string, accounts: string[], message_public_key: string, encrypted_message_keys: string[]): boolean {
  if (accounts.length != encrypted_message_keys.length) {
    return false;
  }

  let all_message_public_keys = new PersistentVector<string>(getCollectionName("all_message_public_keys"));
  let all_channels = getChannelsCollection();

  if (all_message_public_keys.length == 0) {
    all_message_public_keys.push(""); // 0th key refers to no encryption
  }

  let key_id = all_message_public_keys.length;
  let channel_id = all_channels.length;

  all_message_public_keys.push(message_public_key);
  all_channels.push(new Channel(channel_name, accounts, key_id));

  for (let i = 0; i < accounts.length; ++ i) {
    let account_id = accounts[i];
    let encrypted_message_secret_keys = new PersistentMap<u32, string>(getSecretKeysMapName(account_id));
    let encrypted_mesasge_secret_keys_indexes = new PersistentVector<u32>(getSecretKeysVectorName(account_id));
    let channels = new PersistentVector<u32>(getChannelsVectorName(account_id));

    encrypted_mesasge_secret_keys_indexes.push(key_id);
    encrypted_message_secret_keys.set(key_id, encrypted_message_keys[i]);
    channels.push(channel_id);
  }

  return true;
}

export function getAccountChannels(account_id: string): Array<ChannelNameIdAndKey> {
  let channels = new PersistentVector<u32>(getChannelsVectorName(account_id));
  let all_channels = new PersistentVector<Channel>(getCollectionName("all_channels"));

  let ret = new Array<ChannelNameIdAndKey>();

  for (let i = 0; i < channels.length; ++ i) {
    let encrypted_message_secret_keys = new PersistentMap<u32, string>(getSecretKeysMapName(account_id));
    let channel = all_channels[channels[i]];

    if (encrypted_message_secret_keys.contains(channel.message_key_id)) {
      ret.push(new ChannelNameIdAndKey(channel.channel_name, channels[i], channel.message_key_id, encrypted_message_secret_keys.get(channel.message_key_id)!));
    }
  }

  return ret;
}

export function getChannel(channel_id: u32): Channel {
  let all_channels = new PersistentVector<Channel>(getCollectionName("all_channels"));
  return all_channels[channel_id];
}
