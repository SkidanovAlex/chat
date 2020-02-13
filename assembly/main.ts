// @nearfile

import { context, storage, logging, PersistentVector } from "near-runtime-ts";

import { PostedMessage, Thread } from "./model";

const LARGEST_MESSAGE_KEY = "LARGEST_MESSAGE_KEY";

export function addMessage(channel: string, thread_id: u64, text: string): void {
  let msg_id = storage.getPrimitive<u64>(LARGEST_MESSAGE_KEY, 0);
  msg_id = msg_id + 1;
  storage.set(LARGEST_MESSAGE_KEY, msg_id);

  if (thread_id == 0) {
    thread_id = msg_id;
  }

  let message: PostedMessage = {
    message_id: msg_id,
    sender: context.sender,
    text: text,
    thread_id: thread_id,
    channel: channel,
  };

  let thread: Thread = {
    channel,
    thread_id,
    name: text,
  };

  let key = "MSG6$" + channel + "$" + thread_id.toString() + "$" + msg_id.toString();
  logging.log("Saving message. Key: " + key + ", text: " + text);
  storage.set(key, message);

  let tkey = "THR6$" + msg_id.toString();
  logging.log("Saving thread title. Key: " + tkey + ", text: " + text);
  storage.set(tkey, thread);
}

export function getMessagesForThread(channel: string, thread_id: u64): Array<PostedMessage> {
  let ret = new Array<PostedMessage>();
  let key_prefix = "MSG6$" + channel + "$" + thread_id.toString() + "$";
  let keys = storage.keys(key_prefix);
  
  for (let i = 0; i < keys.length; ++ i) {
    let posted_message = storage.getSome<PostedMessage>(keys[i]);
    ret.push(posted_message);
  }
  return ret;
}

export function getMessagesForChannel(channel: string): Array<PostedMessage> {
  let ret = new Array<PostedMessage>();
  let key_prefix = "MSG6$";
  let keys = storage.keys(key_prefix);
  
  for (let i = 0; i < keys.length; ++ i) {
    let posted_message = storage.getSome<PostedMessage>(keys[i]);
    if (posted_message.channel == channel) {
      ret.push(posted_message);
    }
  }
  return ret;
}

export function getAllMessages(): Array<PostedMessage> {
  let ret = new Array<PostedMessage>();
  let key_prefix = "MSG6$";
  let keys = storage.keys(key_prefix);
  
  for (let i = 0; i < keys.length; ++ i) {
    let posted_message = storage.getSome<PostedMessage>(keys[i]);
    ret.push(posted_message);
  }
  return ret;
}

export function getThreadName(thread_id: u64): String {
  let tkey = "THR6$" + thread_id.toString();
  logging.log("Fetching thread title. Key: " + tkey);
  return storage.getSome<Thread>(tkey).name;
}

export function setThreadName(channel: string, thread_id: u64, name: string): void {
  let tkey = "THR6$" + thread_id.toString();
  logging.log("Saving thread title. Key: " + tkey);
  let thread: Thread = { channel, thread_id, name: '!' + name };
  storage.set(tkey, thread);
}

export function getAllThreads(): Array<Thread> {
  let ret = new Array<Thread>();

  let tkey = "THR6$";
  let keys = storage.keys(tkey);

  for (let i = 0; i < keys.length; ++ i) {
    let thread = storage.getSome<Thread>(keys[i]);
    if (thread.name.length > 0 && thread.name[0] == '!') {
      ret.push(thread);
    }
  }
  return ret;
}