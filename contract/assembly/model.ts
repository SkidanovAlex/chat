// @nearfile
import { storage } from 'near-sdk-as';

const PROTOCOL_VERSION = "30";


export class PostedMessage {

  constructor(
    public message_id: u64,
    public sender: string,
    public text: string,
    public thread_id: u64,
    public message_key_id: u32,
    public channel_id: u32){}

}

export class RetrievedMessage {

  constructor(
    public message_id: u64,
    public sender: string,
    public text: string,
    public thread_id: u64,
    public thread_name: string,
    public message_key_id: u32,
    public message_key: string,
    public channel_id: u32,
    public channel: string){}

}

export const THREAD_NAME_PREFIX = "!";

export class Thread {

  constructor(
    public channel: u32,
    public thread_id: u64,
    public name: string){}

}

export class DeviceKey {

  constructor(
    public device_name: string,
    public device_public_key: string,
    public encrypted_account_key: string){}

}

export class Channel {

  constructor(
    public channel_name: string,
    public accounts: string[],
    public message_key_id: u32){}

}

export class ChannelNameIdAndKey {

  constructor(
    public channel_name: string,
    public channel_id: u32,
    public message_key_id: u32,
    public message_key: string){}
}

export function getChannelCollectionName(channel: u32): string {
    return "CHANNEL" + PROTOCOL_VERSION + ":" + channel.toString();
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

export function getSecretKeysVectorName(account_id: string): string {
  return "MSGKEYVECTOR" + PROTOCOL_VERSION + ":" + account_id;
}

export function getSecretKeysMapName(account_id: string): string {
  return "MSGKEYMAP" + PROTOCOL_VERSION + ":" + account_id;
}

export function getChannelsVectorName(account_id: string): string {
  return "CHANNELSVECTOR" + PROTOCOL_VERSION + ":" + account_id;
}
