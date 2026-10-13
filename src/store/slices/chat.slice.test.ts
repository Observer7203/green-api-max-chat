import { describe, expect, it } from 'vitest';

import { greenApiEndpoints } from '@/services/green-api/green-api.endpoints';
import { createDeferred, createTestStore, stubGreenApi, TEST_INSTANCE } from '@/test/utils';
import type { JournalMessage, MessageNotification, SendMessageResponse } from '@/types';

import { authActions } from './auth.slice';
import { chatActions, selectChatPreviews, selectMessages, selectUnreadCount } from './chat.slice';

const CHAT_ID = '100000001';
const OTHER_CHAT_ID = '100000002';

const { sendMessage, getChatHistory, getRecentMessages, getContacts } = greenApiEndpoints.endpoints;

const createIncoming = (
  idMessage: string,
  chatId = CHAT_ID,
  timestamp = 1_700_000_000
): MessageNotification => ({
  typeWebhook: 'incomingMessageReceived',
  timestamp,
  idMessage,
  senderData: { chatId, sender: chatId, chatName: 'Анна', senderName: 'Анна' },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
});

const createJournalEntry = (overrides: Partial<JournalMessage>): JournalMessage => ({
  type: 'incoming',
  idMessage: 'JOURNAL-1',
  timestamp: 1_700_000_000,
  typeMessage: 'textMessage',
  chatId: CHAT_ID,
  textMessage: 'Из истории',
  ...overrides,
});

describe('sending a message', () => {
  it('shows the message at once and confirms it when GREEN-API accepts it', async () => {
    const response = createDeferred<SendMessageResponse>();
    const fetchMock = stubGreenApi({ sendMessage: () => response.promise });
    const store = createTestStore();

    const request = store.dispatch(sendMessage.initiate({ chatId: CHAT_ID, message: 'Привет' }));

    expect(selectMessages(store.getState(), CHAT_ID)).toMatchObject([
      { direction: 'outgoing', text: 'Привет', status: 'pending' },
    ]);

    response.resolve({ idMessage: 'SERVER-ID' });
    await request;

    expect(selectMessages(store.getState(), CHAT_ID)).toMatchObject([
      { id: 'SERVER-ID', status: 'sent' },
    ]);
    expect(fetchMock.mock.calls[0][0].url).toBe(
      `https://1101.api.green-api.com/waInstance${TEST_INSTANCE.idInstance}/sendMessage/${TEST_INSTANCE.apiTokenInstance}`
    );
  });

  it('marks the message as failed and explains why', async () => {
    stubGreenApi({ sendMessage: () => Response.json({}, { status: 466 }) });
    const store = createTestStore();

    await store.dispatch(sendMessage.initiate({ chatId: CHAT_ID, message: 'Привет' }));

    expect(selectMessages(store.getState(), CHAT_ID)).toMatchObject([
      { status: 'failed', error: 'Исчерпан лимит тарифа GREEN-API.' },
    ]);
  });

  it('keeps a single message when its notification outruns the response', async () => {
    const response = createDeferred<SendMessageResponse>();
    stubGreenApi({ sendMessage: () => response.promise });
    const store = createTestStore();

    const request = store.dispatch(sendMessage.initiate({ chatId: CHAT_ID, message: 'Привет' }));
    store.dispatch(
      chatActions.notificationReceived({
        ...createIncoming('SERVER-ID'),
        typeWebhook: 'outgoingAPIMessageReceived',
      })
    );
    response.resolve({ idMessage: 'SERVER-ID' });
    await request;

    expect(selectMessages(store.getState(), CHAT_ID)).toHaveLength(1);
  });

  it('removes a failed message that the user sends again', async () => {
    stubGreenApi({ sendMessage: () => Response.json({}, { status: 500 }) });
    const store = createTestStore();

    await store.dispatch(sendMessage.initiate({ chatId: CHAT_ID, message: 'Привет' }));
    const [failed] = selectMessages(store.getState(), CHAT_ID);
    store.dispatch(chatActions.messageDiscarded({ chatId: CHAT_ID, id: failed.id }));

    expect(selectMessages(store.getState(), CHAT_ID)).toEqual([]);
  });
});

describe('receiving notifications', () => {
  it('adds an incoming message and names the chat after the sender', () => {
    const store = createTestStore();

    store.dispatch(chatActions.notificationReceived(createIncoming('A')));

    expect(selectMessages(store.getState(), CHAT_ID)).toMatchObject([{ id: 'A', text: 'Привет' }]);
    expect(selectChatPreviews(store.getState())).toMatchObject([
      { chatId: CHAT_ID, title: 'Анна' },
    ]);
  });

  it('ignores a notification that is delivered twice', () => {
    const store = createTestStore();

    store.dispatch(chatActions.notificationReceived(createIncoming('A')));
    store.dispatch(chatActions.notificationReceived(createIncoming('A')));

    expect(selectMessages(store.getState(), CHAT_ID)).toHaveLength(1);
    expect(selectUnreadCount(store.getState())).toBe(1);
  });

  it('keeps messages in chronological order when they arrive out of order', () => {
    const store = createTestStore();

    store.dispatch(chatActions.notificationReceived(createIncoming('LATER', CHAT_ID, 200)));
    store.dispatch(chatActions.notificationReceived(createIncoming('EARLIER', CHAT_ID, 100)));

    expect(selectMessages(store.getState(), CHAT_ID).map(({ id }) => id)).toEqual([
      'EARLIER',
      'LATER',
    ]);
  });

  it('counts unread messages only in chats that are not open', () => {
    const store = createTestStore();

    store.dispatch(chatActions.chatOpened(CHAT_ID));
    store.dispatch(chatActions.notificationReceived(createIncoming('A', CHAT_ID)));
    store.dispatch(chatActions.notificationReceived(createIncoming('B', OTHER_CHAT_ID)));

    expect(selectUnreadCount(store.getState())).toBe(1);

    store.dispatch(chatActions.chatOpened(OTHER_CHAT_ID));

    expect(selectUnreadCount(store.getState())).toBe(0);
  });

  it('updates the delivery status and never moves it backwards', async () => {
    stubGreenApi({ sendMessage: () => ({ idMessage: 'SERVER-ID' }) });
    const store = createTestStore();
    const reportStatus = (status: 'delivered' | 'read') =>
      store.dispatch(
        chatActions.notificationReceived({
          typeWebhook: 'outgoingMessageStatus',
          timestamp: 1_700_000_000,
          chatId: CHAT_ID,
          idMessage: 'SERVER-ID',
          status,
        })
      );

    await store.dispatch(sendMessage.initiate({ chatId: CHAT_ID, message: 'Привет' }));
    reportStatus('read');
    reportStatus('delivered');

    expect(selectMessages(store.getState(), CHAT_ID)).toMatchObject([{ status: 'read' }]);
  });
});

describe('loading journals', () => {
  it('merges the history with messages that are already known', async () => {
    stubGreenApi({
      getChatHistory: () => [
        createJournalEntry({ idMessage: 'A', timestamp: 1_700_000_000 }),
        createJournalEntry({ idMessage: 'OLDER', timestamp: 1_600_000_000 }),
      ],
    });
    const store = createTestStore();

    store.dispatch(chatActions.notificationReceived(createIncoming('A')));
    await store.dispatch(getChatHistory.initiate(CHAT_ID));

    expect(selectMessages(store.getState(), CHAT_ID).map(({ id }) => id)).toEqual(['OLDER', 'A']);
  });

  it('builds the chat list from both journals, the most recent chat first', async () => {
    stubGreenApi({
      lastIncomingMessages: () => [
        createJournalEntry({ idMessage: 'IN', timestamp: 100, senderName: 'Анна' }),
      ],
      lastOutgoingMessages: () => [
        createJournalEntry({
          type: 'outgoing',
          idMessage: 'OUT',
          timestamp: 200,
          chatId: OTHER_CHAT_ID,
          textMessage: 'Добрый день',
        }),
      ],
    });
    const store = createTestStore();

    await store.dispatch(getRecentMessages.initiate());

    expect(selectChatPreviews(store.getState())).toMatchObject([
      { chatId: OTHER_CHAT_ID, title: 'Чат 100000002', lastMessage: { text: 'Добрый день' } },
      { chatId: CHAT_ID, title: 'Анна', lastMessage: { text: 'Из истории' } },
    ]);
  });
});

describe('naming chats', () => {
  const contacts = [{ chatId: CHAT_ID, name: 'anna_k', contactName: 'Анна Ким', phoneNumber: 0 }];

  it('names a chat after the address book, whichever of the two is loaded first', async () => {
    stubGreenApi({ getContacts: () => contacts });
    const store = createTestStore();

    store.dispatch(chatActions.chatOpened(OTHER_CHAT_ID));
    await store.dispatch(getContacts.initiate());
    store.dispatch(chatActions.chatOpened(CHAT_ID));

    const titles = Object.fromEntries(
      selectChatPreviews(store.getState()).map(({ chatId, title }) => [chatId, title])
    );

    expect(titles).toEqual({ [OTHER_CHAT_ID]: 'Чат 100000002', [CHAT_ID]: 'Анна Ким' });
  });

  it('shows the number a chat was started with until its name is known', () => {
    const store = createTestStore();

    store.dispatch(chatActions.chatOpened(CHAT_ID, '79991234567'));

    expect(selectChatPreviews(store.getState())).toMatchObject([{ title: '+79991234567' }]);

    store.dispatch(chatActions.notificationReceived(createIncoming('A')));

    expect(selectChatPreviews(store.getState())).toMatchObject([
      { title: 'Анна', phone: '79991234567' },
    ]);
  });
});

describe('ending the session', () => {
  it('forgets every chat on logout', () => {
    const store = createTestStore();

    store.dispatch(chatActions.notificationReceived(createIncoming('A')));
    store.dispatch(authActions.loggedOut());

    expect(selectChatPreviews(store.getState())).toEqual([]);
  });

  it('logs out when GREEN-API rejects the stored token', async () => {
    stubGreenApi({ getChatHistory: () => Response.json({}, { status: 401 }) });
    const store = createTestStore();

    await store.dispatch(getChatHistory.initiate(CHAT_ID));

    expect(store.getState().auth).toEqual({ instance: null, sessionExpired: true });
  });
});
