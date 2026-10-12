import { describe, expect, it } from 'vitest';

import type { JournalMessage, MessageData, MessageNotification } from '@/types';

import {
  getChatDetailsFromJournal,
  getChatDetailsFromNotification,
  pickLatestStatus,
  toMessageFromJournal,
  toMessageFromNotification,
  toMessageStatus,
} from './message.utils';

const CHAT_ID = '100000001';
const GROUP_ID = '-10000000000001';

const createNotification = (
  messageData: MessageData,
  overrides: Partial<MessageNotification> = {}
): MessageNotification => ({
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1_700_000_000,
  idMessage: 'MESSAGE-1',
  senderData: { chatId: CHAT_ID, sender: CHAT_ID, chatName: 'Анна', senderName: 'Анна' },
  messageData,
  ...overrides,
});

describe('toMessageFromNotification', () => {
  it('maps an incoming text message', () => {
    const notification = createNotification({
      typeMessage: 'textMessage',
      textMessageData: { textMessage: 'Привет' },
    });

    expect(toMessageFromNotification(notification)).toEqual({
      id: 'MESSAGE-1',
      chatId: CHAT_ID,
      direction: 'incoming',
      text: 'Привет',
      timestamp: 1_700_000_000_000,
      senderName: 'Анна',
    });
  });

  it('reads the text of a message with a link preview or a quote', () => {
    const notification = createNotification({
      typeMessage: 'extendedTextMessage',
      extendedTextMessageData: { text: 'https://green-api.com' },
    });

    expect(toMessageFromNotification(notification)?.text).toBe('https://green-api.com');
  });

  it('treats a message sent from the phone as an outgoing one that is already sent', () => {
    const notification = createNotification(
      { typeMessage: 'textMessage', textMessageData: { textMessage: 'Сам написал' } },
      { typeWebhook: 'outgoingMessageReceived' }
    );

    expect(toMessageFromNotification(notification)).toMatchObject({
      direction: 'outgoing',
      status: 'sent',
    });
  });

  it('prefers the caption of a file and falls back to a label', () => {
    const withCaption = createNotification({
      typeMessage: 'imageMessage',
      fileMessageData: { caption: 'Скриншот' },
    });
    const withoutCaption = createNotification({ typeMessage: 'imageMessage' });

    expect(toMessageFromNotification(withCaption)?.text).toBe('Скриншот');
    expect(toMessageFromNotification(withoutCaption)?.text).toBe('📷 Фото');
  });

  it('skips events that are not messages of their own', () => {
    expect(toMessageFromNotification(createNotification({ typeMessage: 'reactionMessage' }))).toBe(
      null
    );
  });
});

describe('toMessageFromJournal', () => {
  const entry: JournalMessage = {
    type: 'outgoing',
    idMessage: 'MESSAGE-2',
    timestamp: 1_700_000_100,
    typeMessage: 'extendedTextMessage',
    chatId: CHAT_ID,
    extendedTextMessage: { text: 'Ответ' },
    statusMessage: 'delivered',
  };

  it('maps an outgoing entry together with its delivery status', () => {
    expect(toMessageFromJournal(entry)).toEqual({
      id: 'MESSAGE-2',
      chatId: CHAT_ID,
      direction: 'outgoing',
      text: 'Ответ',
      timestamp: 1_700_000_100_000,
      status: 'delivered',
    });
  });

  it('signs an incoming entry with the name from the address book first', () => {
    const incoming: JournalMessage = {
      ...entry,
      type: 'incoming',
      senderName: 'anna_k',
      senderContactName: 'Анна',
    };

    expect(toMessageFromJournal(incoming)?.senderName).toBe('Анна');
  });
});

describe('getChatDetailsFromNotification', () => {
  const text: MessageData = { typeMessage: 'textMessage', textMessageData: { textMessage: '…' } };

  it('takes the name and the number of the other person from their message', () => {
    const notification = createNotification(text, {
      senderData: {
        chatId: CHAT_ID,
        sender: CHAT_ID,
        senderName: 'Анна',
        senderPhoneNumber: 79991234567,
      },
    });

    expect(getChatDetailsFromNotification(notification)).toEqual({
      name: 'Анна',
      phone: '79991234567',
    });
  });

  it('never describes a group by one of its members', () => {
    const notification = createNotification(text, {
      senderData: {
        chatId: GROUP_ID,
        sender: CHAT_ID,
        senderName: 'Анна',
        senderPhoneNumber: 79991234567,
      },
    });

    expect(getChatDetailsFromNotification(notification)).toEqual({});
  });

  it('never describes a chat by the sender of an outgoing message', () => {
    const notification = createNotification(text, {
      typeWebhook: 'outgoingMessageReceived',
      senderData: {
        chatId: CHAT_ID,
        sender: 'me',
        senderName: 'Я',
        senderPhoneNumber: 79000000000,
      },
    });

    expect(getChatDetailsFromNotification(notification)).toEqual({});
  });
});

describe('getChatDetailsFromJournal', () => {
  it('names a private chat after the author of an incoming entry', () => {
    const entry: JournalMessage = {
      type: 'incoming',
      idMessage: 'MESSAGE-3',
      timestamp: 1_700_000_200,
      typeMessage: 'textMessage',
      chatId: CHAT_ID,
      textMessage: 'Привет',
      senderName: 'Анна',
    };

    expect(getChatDetailsFromJournal(entry)).toEqual({ name: 'Анна' });
    expect(getChatDetailsFromJournal({ ...entry, type: 'outgoing' })).toEqual({});
  });
});

describe('message statuses', () => {
  it.each([
    ['delivered', 'delivered'],
    ['noAccount', 'failed'],
    ['notInGroup', 'failed'],
    [undefined, 'sent'],
  ] as const)('maps the API status %s to %s', (apiStatus, expected) => {
    expect(toMessageStatus(apiStatus)).toBe(expected);
  });

  it('moves a status forward', () => {
    expect(pickLatestStatus('sent', 'delivered')).toBe('delivered');
    expect(pickLatestStatus(undefined, 'pending')).toBe('pending');
  });

  it('ignores a status that arrives late', () => {
    expect(pickLatestStatus('read', 'delivered')).toBe('read');
  });

  it('lets a failure override "sent", but not a confirmed delivery', () => {
    expect(pickLatestStatus('sent', 'failed')).toBe('failed');
    expect(pickLatestStatus('delivered', 'failed')).toBe('delivered');
  });
});
