// @nearfile
import { storage } from 'near-runtime-ts';

export function getChannel(key: string): string {
  let first = key.indexOf("$");
  return key.substring(first + 1, key.indexOf("$", first + 1));
}

const  MESSAGE_PREFIX: string = "MSG6$";


// Exporting a new class PostedMessage so it can be used outside of this file.
export class PostedMessage {

  constructor(
    public message_id: u64,
    public sender: string,
    public text: string,
    public thread_id: u64,
    public channel: string){}

  get key(): string {
    return MESSAGE_PREFIX + 
            this.channel   + "$" + 
            this.thread_id.toString() + "$" + 
            this.message_id.toString();
  }

  get threadKey(): string {
    return THREAD_PREFIX + this.message_id.toString();
  }

  static message_prefix(channel: string, thread_id: u64): string {
    return MESSAGE_PREFIX +
           channel + "$" + 
           thread_id.toString() + "$";
  }

  static get keys(): string[] {
    return storage.keys(MESSAGE_PREFIX);
  }

  
}


export const THREAD_PREFIX = "THR6$";
export const THREAD_NAME_PREFIX = "!";

export class Thread {

  constructor(
    public channel: string,
    public thread_id: u64,
    public name: string){}

  get key(): string {
    return THREAD_PREFIX + this.thread_id.toString();
  }

  static prefix(thread_id: u64): string {
    return THREAD_PREFIX + thread_id.toString();
  }

  static get keys(): string[] {
    return storage.keys(THREAD_PREFIX);
  }
}

export function currID(): u64 {
  return storage.getPrimitive<u64>(LARGEST_MESSAGE_KEY, 0);
}

export function nextID(): u64 {
  return currID() + 1;
}

export const LARGEST_MESSAGE_KEY = "LARGEST_MESSAGE_KEY";
