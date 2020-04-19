// @nearfile
import { context, logging, PersistentVector, PersistentMap } from "near-sdk-as";
import { PostedMessage, Thread, DeviceKey, getChannelCollectionName, getThreadCollectionName } from './model';

export function addMessage(channel: string, thread_id: u64, text: string): void {
  let allMessages = new PersistentVector<PostedMessage>("messages");
  let msg_id = allMessages.length;

  if (thread_id == 0) {
    thread_id = msg_id;
  }

  let message = new PostedMessage(msg_id, context.sender, text, thread_id, channel);
  let thread  = new Thread(channel, thread_id, text);

  allMessages.push(message);

  let threads = new PersistentMap<u64, Thread>("threads");
  threads.set(thread_id, thread);

  let channelMessageIds = new PersistentVector<u32>(getChannelCollectionName(channel));
  channelMessageIds.push(msg_id);

  let threadMessageIds = new PersistentVector<u32>(getThreadCollectionName(thread_id));
  threadMessageIds.push(msg_id);
}

export function getMessagesForThread(channel: string, thread_id: u64): Array<PostedMessage> {
  let allMessages = new PersistentVector<PostedMessage>("messages");
  let threadMessageIds = new PersistentVector<u32>(getThreadCollectionName(thread_id));

  let ret = new Array<PostedMessage>();
  
  for (let i = 0; i < threadMessageIds.length; ++i) {
    let posted_message = allMessages[threadMessageIds[i]];
    ret.push(posted_message);
  }
  return ret;
}

export function getMessagesForChannel(channel: string): Array<PostedMessage> {
  let allMessages = new PersistentVector<PostedMessage>("messages");
  let channelMessageIds = new PersistentVector<u32>(getChannelCollectionName(channel));

  let ret = new Array<PostedMessage>();
  
  for (let i = 0; i < channelMessageIds.length; ++i) {
    let posted_message = allMessages[channelMessageIds[i]];
    ret.push(posted_message);
  }
  return ret;
}

export function getAllMessages(): Array<PostedMessage> {
  let allMessages = new PersistentVector<PostedMessage>("messages");

  let ret = new Array<PostedMessage>();
  
  for (let i = 0; i < allMessages.length; ++ i) {
    ret.push(allMessages[i]);
  }
  return ret;
}

export function getThreadName(thread_id: u64): String {
  let threads = new PersistentMap<u64, Thread>("threads");
  return threads.get(thread_id)!.name;
}

export function setThreadName(channel: string, thread_id: u64, name: string): void {
  let thread = new Thread(channel, thread_id, '!' + name);
  let threads = new PersistentMap<u64, Thread>("threads");
  let allThreadIds = new PersistentVector<u64>("all_threads");

  let existingThread = threads.get(thread_id)!;
  if (!existingThread.name.startsWith("!")) {
    allThreadIds.push(thread_id);
  }
  threads.set(thread_id, thread);
}

export function getAllThreads(): Array<Thread> {
  let threads = new PersistentMap<u64, Thread>("threads");
  let allThreadIds = new PersistentVector<u64>("all_threads");

  let ret = new Array<Thread>();

  for (let i = 0; i < allThreadIds.length; ++ i) {
    ret.push(threads.get(allThreadIds[i])!);
  }
  return ret;
}

export function setDeviceAccountKey(device_name: string, device_public_key: string, encrypted_account_key: string): void {
  let account_keys = new PersistentMap<string, string>("account_keys");

  let account_key = account_keys.get(context.sender)!;
  if (account_key != "") {
    return;
  }

  let device_key = new DeviceKey(device_name, device_public_key, encrypted_account_key);

  //let all_device_public_keys = new PersistentMap<string, PersistentVector<string>>("all_device_public_keys");
  //let device_public_keys = all_device_public_keys.get(context.sender)!;

  //let device_keys = new PersistentMap<string, DeviceKey>("device_keys");

  //device_public_keys.push(device_public_key);
  //device_keys.set(device_public_key, device_key)
  //account_keys.set(context.sender, encrypted_account_key);
}

export function getAccountKey(account_id: string): String {
  let account_keys = new PersistentMap<string, string>("account_keys");

  let account_key = account_keys.get(account_id)!;
  return account_key;
}
