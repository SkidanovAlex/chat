// @nearfile
import { context, logging, PersistentVector, PersistentMap } from "near-sdk-as";
import { PostedMessage, Thread, DeviceKey, getChannelCollectionName, getThreadCollectionName, getDeviceKeysCollectionName, getCollectionName } from './model';

export function addMessage(channel: string, thread_id: u64, text: string): void {
  let allMessages = new PersistentVector<PostedMessage>(getCollectionName("messages"));
  let msg_id = allMessages.length;

  if (thread_id == 0) {
    thread_id = msg_id;
  }

  let message = new PostedMessage(msg_id, context.sender, text, thread_id, channel);
  let thread  = new Thread(channel, thread_id, text);

  allMessages.push(message);

  let threads = new PersistentMap<u64, Thread>(getCollectionName("threads"));
  threads.set(thread_id, thread);

  let channelMessageIds = new PersistentVector<u32>(getChannelCollectionName(channel));
  channelMessageIds.push(msg_id);

  let threadMessageIds = new PersistentVector<u32>(getThreadCollectionName(thread_id));
  threadMessageIds.push(msg_id);
}

export function getMessagesForThread(channel: string, thread_id: u64): Array<PostedMessage> {
  let allMessages = new PersistentVector<PostedMessage>(getCollectionName("messages"));
  let threadMessageIds = new PersistentVector<u32>(getThreadCollectionName(thread_id));

  let ret = new Array<PostedMessage>();
  
  for (let i = 0; i < threadMessageIds.length; ++i) {
    let posted_message = allMessages[threadMessageIds[i]];
    ret.push(posted_message);
  }
  return ret;
}

export function getMessagesForChannel(channel: string): Array<PostedMessage> {
  let allMessages = new PersistentVector<PostedMessage>(getCollectionName("messages"));
  let channelMessageIds = new PersistentVector<u32>(getChannelCollectionName(channel));

  let ret = new Array<PostedMessage>();
  
  for (let i = 0; i < channelMessageIds.length; ++i) {
    let posted_message = allMessages[channelMessageIds[i]];
    ret.push(posted_message);
  }
  return ret;
}

export function getAllMessages(): Array<PostedMessage> {
  let allMessages = new PersistentVector<PostedMessage>(getCollectionName("messages"));

  let ret = new Array<PostedMessage>();
  
  for (let i = 0; i < allMessages.length; ++ i) {
    ret.push(allMessages[i]);
  }
  return ret;
}

export function getThreadName(thread_id: u64): String {
  let threads = new PersistentMap<u64, Thread>(getCollectionName("threads"));
  return threads.get(thread_id)!.name;
}

export function setThreadName(channel: string, thread_id: u64, name: string): void {
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
