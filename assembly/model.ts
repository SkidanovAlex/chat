// @nearfile

// Exporting a new class PostedMessage so it can be used outside of this file.
export class PostedMessage {
  message_id: u64;
  sender: string;
  text: string;
  thread_id: u64;
  channel: string;
}

export class Thread {
  channel: string;
  thread_id: u64;
  name: string;
}
