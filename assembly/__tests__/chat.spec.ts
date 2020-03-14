import { LARGEST_MESSAGE_KEY, currID, THREAD_NAME_PREFIX } from '../model';
import { storage } from "near-sdk-as";
import { addMessage, getMessagesForThread, getMessagesForChannel, setThreadName, getThreadName, getAllMessages } from '../main';
import { VM } from "near-sdk-as";

const general = "general";
const firstMessage = "First Message";
const secondMessage = "Second Meassage";
const secondThreadMessage = "Second Message in Thread";
const threadName = "First Thread";
const all_messages: string[] = [firstMessage, secondThreadMessage, secondMessage];

describe("Adding message", () => {
  afterAll(() => {
    log(VM.outcome().logs);
  });

  it("initially be no messages", () => {
    expect(currID()).toBe(0, "current key is zero");
  });

  it("be able to add one", () => {
    addMessage(general, 0, firstMessage);

    expect(currID()).toBe(1, "first message should have message id of 1");

    const fromThread = getMessagesForThread(general, 1);
    const fromChannel = getMessagesForChannel(general);
    expect(fromThread).toStrictEqual(fromChannel, "The messages in thread should equal the channel");

    expect(fromThread.length).toBe(1, "should be one message retrived from thread");
    expect(fromThread[0].text).toBe(firstMessage);
  });

  it("have two messages without threads", () => {
    addMessage(general, 0, secondMessage);
    expect(currID()).toBe(2, "second message has ID of 2");

    const fromThread = getMessagesForThread(general, 2);
    const fromChannel = getMessagesForChannel(general);
    expect(fromChannel).toIncludeEqual(fromThread[0], "message in thread should be included in the channel");
    expect(fromThread.length).toBe(1, "should be one message retrived from thread");
    expect(fromThread[0].text).toBe(secondMessage);
  });

  it("should be able to add threads", () => {
    addMessage(general, 1, secondThreadMessage);
    setThreadName(general, 1, threadName);
    expect(getThreadName(1)).toBe(THREAD_NAME_PREFIX + threadName, "thread name");
  });

  it("should return all messages", () => {
    const messages = getAllMessages().map<string>(m => m.text);
    expect(messages).toStrictEqual(all_messages);
    log(VM.outcome().logs);
  });

});
