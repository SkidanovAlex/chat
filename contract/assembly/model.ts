// @nearfile
import { storage } from 'near-sdk-as';

const PROTOCOL_VERSION = "11";


// Exporting a new class PostedMessage so it can be used outside of this file.
export class PostedMessage {

  constructor(
    public message_id: u64,
    public sender: string,
    public text: string,
    public thread_id: u64,
    public channel: string){}

}


export const THREAD_NAME_PREFIX = "!";

export class Thread {

  constructor(
    public channel: string,
    public thread_id: u64,
    public name: string){}

}

export class DeviceKey {

  constructor(
    public device_name: string,
    public device_public_key: string,
    public encrypted_account_key: string){}

}

export function getChannelCollectionName(channel: string): string {
    return "CHANNEL" + PROTOCOL_VERSION + ":" + channel;
}

export function getThreadCollectionName(threadId: u64): string {
    return "THREAD" + PROTOCOL_VERSION + ":" + threadId.toString();
}

export function getDeviceKeysCollectionName(account_id: string): string {
  return "DEVICEKEY" + PROTOCOL_VERSION + ":" + account_id;
}

export function getCollectionName(collection: string): string {
    return collection + PROTOCOL_VERSION;
}
