import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { greenApiEndpoints } from '@/services/green-api/green-api.endpoints';
import type {
  Chat,
  ChatDetails,
  ChatPreview,
  JournalMessage,
  Message,
  NotificationBody,
} from '@/types';
import { getChatTitle } from '@/utils/chat.utils';
import { getErrorMessage } from '@/utils/error.utils';
import {
  getChatDetailsFromJournal,
  getChatDetailsFromNotification,
  pickLatestStatus,
  toMessageFromJournal,
  toMessageFromNotification,
  toMessageStatus,
} from '@/utils/message.utils';

import { authActions } from './auth.slice';

export interface ChatState {
  chats: Record<string, Chat>;
  /** Names and numbers from the address book by chat id, for chats that are yet to appear. */
  contacts: Record<string, ChatDetails>;
  /** Messages of every chat, oldest first. */
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  /** The notification queue is unreachable, so new messages are not arriving. */
  isOffline: boolean;
}

const initialState: ChatState = {
  chats: {},
  contacts: {},
  messages: {},
  activeChatId: null,
  isOffline: false,
};

const EMPTY_MESSAGES: Message[] = [];

const { sendMessage, getChatHistory, getRecentMessages, getContacts } = greenApiEndpoints.endpoints;

/** Finds the chat or creates it, and adds whatever has just been learnt about it. */
const upsertChat = (
  state: ChatState,
  chatId: string,
  createdAt: number,
  details: ChatDetails = {}
): Chat => {
  const chat = (state.chats[chatId] ??= {
    chatId,
    unreadCount: 0,
    createdAt,
    ...state.contacts[chatId],
  });

  if (details.name) {
    chat.name = details.name;
  }
  if (details.phone) {
    chat.phone = details.phone;
  }
  return chat;
};

/**
 * Adds a message, or refreshes the status of one that is already known. The same message
 * can come from the send response, a notification and the history, in any order.
 *
 * @returns whether the message is new.
 */
const upsertMessage = (state: ChatState, message: Message): boolean => {
  const messages = (state.messages[message.chatId] ??= []);
  const existing = messages.find(({ id }) => id === message.id);

  if (existing) {
    if (message.status) {
      existing.status = pickLatestStatus(existing.status, message.status);
    }
    return false;
  }

  // Messages nearly always arrive in order, so the right place is at the end or close to it.
  let index = messages.length;
  while (index > 0 && messages[index - 1].timestamp > message.timestamp) {
    index -= 1;
  }
  messages.splice(index, 0, message);

  return true;
};

const mergeJournal = (state: ChatState, journal: JournalMessage[]): void => {
  for (const entry of journal) {
    const message = toMessageFromJournal(entry);

    if (message) {
      upsertChat(state, message.chatId, message.timestamp, getChatDetailsFromJournal(entry));
      upsertMessage(state, message);
    }
  }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    chatOpened: {
      reducer: (
        state,
        action: PayloadAction<{ chatId: string; phone?: string; openedAt: number }>
      ) => {
        const { chatId, phone, openedAt } = action.payload;
        const chat = upsertChat(state, chatId, openedAt, { phone });

        chat.unreadCount = 0;
        state.activeChatId = chatId;
      },
      /** `phone` is known when the chat is started by number rather than picked from the list. */
      prepare: (chatId: string, phone?: string) => ({
        payload: { chatId, phone, openedAt: Date.now() },
      }),
    },

    chatClosed: (state) => {
      state.activeChatId = null;
    },

    /** Drops a message that was never sent, e.g. before sending it again. */
    messageDiscarded: (state, action: PayloadAction<{ chatId: string; id: string }>) => {
      const { chatId, id } = action.payload;
      const messages = state.messages[chatId];

      if (messages) {
        state.messages[chatId] = messages.filter((message) => message.id !== id);
      }
    },

    notificationReceived: (state, { payload }: PayloadAction<NotificationBody>) => {
      switch (payload.typeWebhook) {
        case 'incomingMessageReceived':
        case 'outgoingMessageReceived':
        case 'outgoingAPIMessageReceived': {
          const message = toMessageFromNotification(payload);

          if (!message) {
            return;
          }

          const chat = upsertChat(
            state,
            message.chatId,
            message.timestamp,
            getChatDetailsFromNotification(payload)
          );
          const isNew = upsertMessage(state, message);

          if (isNew && message.direction === 'incoming' && state.activeChatId !== chat.chatId) {
            chat.unreadCount += 1;
          }
          return;
        }

        case 'outgoingMessageStatus': {
          const message = state.messages[payload.chatId]?.find(
            ({ id }) => id === payload.idMessage
          );

          if (message) {
            message.status = pickLatestStatus(message.status, toMessageStatus(payload.status));
          }
          return;
        }

        default:
          return;
      }
    },

    connectionChanged: (state, action: PayloadAction<{ isOnline: boolean }>) => {
      state.isOffline = !action.payload.isOnline;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(authActions.loggedOut, () => initialState)

      // Sending is optimistic: the message appears at once, keyed by the request id,
      // and takes the real `idMessage` when GREEN-API accepts it.
      .addMatcher(sendMessage.matchPending, (state, { meta }) => {
        const { chatId, message } = meta.arg.originalArgs;

        upsertChat(state, chatId, meta.startedTimeStamp);
        upsertMessage(state, {
          id: meta.requestId,
          chatId,
          direction: 'outgoing',
          text: message,
          timestamp: meta.startedTimeStamp,
          status: 'pending',
        });
      })
      .addMatcher(sendMessage.matchFulfilled, (state, { meta, payload }) => {
        const messages = state.messages[meta.arg.originalArgs.chatId] ?? [];
        const index = messages.findIndex(({ id }) => id === meta.requestId);

        if (index === -1) {
          return;
        }

        // The notification about this message can outrun the response to the request.
        if (messages.some(({ id }) => id === payload.idMessage)) {
          messages.splice(index, 1);
        } else {
          messages[index].id = payload.idMessage;
          messages[index].status = 'sent';
        }
      })
      .addMatcher(sendMessage.matchRejected, (state, { meta, payload }) => {
        const message = state.messages[meta.arg.originalArgs.chatId]?.find(
          ({ id }) => id === meta.requestId
        );

        if (message) {
          message.status = 'failed';
          message.error = getErrorMessage(payload);
        }
      })

      .addMatcher(getChatHistory.matchFulfilled, (state, { payload }) => {
        mergeJournal(state, payload);
      })
      .addMatcher(getRecentMessages.matchFulfilled, (state, { payload }) => {
        mergeJournal(state, payload);
      })

      .addMatcher(getContacts.matchFulfilled, (state, { payload }) => {
        for (const { chatId, name, contactName, phoneNumber } of payload) {
          const details: ChatDetails = {
            name: contactName || name || undefined,
            phone: phoneNumber ? String(phoneNumber) : undefined,
          };

          state.contacts[chatId] = details;
          if (state.chats[chatId]) {
            upsertChat(state, chatId, state.chats[chatId].createdAt, details);
          }
        }
      });
  },

  selectors: {
    selectActiveChatId: (state) => state.activeChatId,
    selectIsOffline: (state) => state.isOffline,
    selectChat: (state, chatId: string): Chat | undefined => state.chats[chatId],
    selectMessages: (state, chatId: string) => state.messages[chatId] ?? EMPTY_MESSAGES,

    /** Chats for the sidebar: the most recently active first. */
    selectChatPreviews: createSelector(
      [(state: ChatState) => state.chats, (state: ChatState) => state.messages],
      (chats, messages): ChatPreview[] => {
        const getLastActivity = (chat: ChatPreview) =>
          chat.lastMessage?.timestamp ?? chat.createdAt;

        return Object.values(chats)
          .map((chat) => ({
            ...chat,
            title: getChatTitle(chat),
            lastMessage: messages[chat.chatId]?.at(-1),
          }))
          .sort((first, second) => getLastActivity(second) - getLastActivity(first));
      }
    ),

    selectUnreadCount: (state) =>
      Object.values(state.chats).reduce((total, chat) => total + chat.unreadCount, 0),
  },
});

export const chatReducer = chatSlice.reducer;
export const chatActions = chatSlice.actions;
export const {
  selectActiveChatId,
  selectIsOffline,
  selectChat,
  selectMessages,
  selectChatPreviews,
  selectUnreadCount,
} = chatSlice.selectors;
