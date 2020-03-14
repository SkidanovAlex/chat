// @nearfile
import { context, storage, logging } from "near-sdk-as";
import { PostedMessage, Thread, LARGEST_MESSAGE_KEY, getChannel } from './model';


export function addMessage(channel: string, thread_id: u64, text: string): void {
  let msg_id = storage.getPrimitive<u64>(LARGEST_MESSAGE_KEY, 0);
  msg_id = msg_id + 1;
  storage.set(LARGEST_MESSAGE_KEY, msg_id);

  if (thread_id == 0) {
    thread_id = msg_id;
  }

  let message = new PostedMessage(msg_id, context.sender, text, thread_id, channel);
  let thread  = new Thread(channel, thread_id, text);

  // let key = "MSG6$" + channel + "$" + thread_id.toString() + "$" + msg_id.toString();
  logging.log("Saving message. Key: " + message.key + ", text: " + text);
  storage.set(message.key, message);

  // let tkey = "THR6$" + msg_id.toString();
  logging.log("Saving thread title. Key: " + message.threadKey + ", text: " + text);
  storage.set(message.threadKey, thread);
}

export function getMessagesForThread(channel: string, thread_id: u64): Array<PostedMessage> {
  let ret = new Array<PostedMessage>();
  let keys = storage.keys(PostedMessage.message_prefix(channel, thread_id));
  
  for (let i = 0; i < keys.length; ++i) {
    let posted_message = storage.getSome<PostedMessage>(keys[i]);
    ret.push(posted_message);
  }
  return ret;
}

export function getMessagesForChannel(channel: string): Array<PostedMessage> {
  let ret = new Array<PostedMessage>();
  let keys = PostedMessage.keys;
  
  for (let i = 0; i < keys.length; ++ i) {
    if (getChannel(keys[i])) {
      let posted_message = storage.getSome<PostedMessage>(keys[i]);
      ret.push(posted_message);
    }
  }
  return ret;
}

export function getAllMessages(): Array<PostedMessage> {
  let ret = new Array<PostedMessage>();
  let keys = PostedMessage.keys;
  
  for (let i = 0; i < keys.length; ++ i) {
    let posted_message = storage.getSome<PostedMessage>(keys[i]);
    ret.push(posted_message);
  }
  return ret;
}

export function getThreadName(thread_id: u64): String {
  let tkey = Thread.prefix(thread_id);
  logging.log("Fetching thread title. Key: " + tkey);
  return storage.getSome<Thread>(tkey).name;
}

export function setThreadName(channel: string, thread_id: u64, name: string): void {
  let thread = new Thread(channel, thread_id, '!' + name);
  const tkey = thread.key
  logging.log("Saving thread title. Key: " + tkey);
  storage.set(tkey, thread);
}

export function getAllThreads(): Array<Thread> {
  let ret = new Array<Thread>();
  let keys = Thread.keys;

  for (let i = 0; i < keys.length; ++ i) {
    let thread = storage.getSome<Thread>(keys[i]);
    if (thread.name.length > 0 && thread.name.startsWith('!')) {
      ret.push(thread);
    }
  }
  return ret;
}