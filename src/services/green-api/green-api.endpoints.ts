import type {
  CheckAccountResponse,
  Contact,
  DeleteNotificationResponse,
  Instance,
  InstanceSettings,
  JournalMessage,
  ReceiveNotificationResponse,
  SendMessageRequest,
  SendMessageResponse,
  SetSettingsResponse,
  StateInstanceResponse,
} from '@/types';

import { greenApi } from './green-api.service';

const HISTORY_PAGE_SIZE = 100;
const RECENT_MESSAGES_WINDOW_MINUTES = 24 * 60;

/** How long the server holds a `receiveNotification` request open while the queue is empty. */
const RECEIVE_TIMEOUT_SECONDS = 20;
/** The client must outwait the server, otherwise every idle long poll would end as a timeout. */
const RECEIVE_REQUEST_TIMEOUT_MS = (RECEIVE_TIMEOUT_SECONDS + 10) * 1000;

export const greenApiEndpoints = greenApi.injectEndpoints({
  endpoints: (builder) => ({
    /** `getStateInstance` with explicit credentials: the way to check them before login. */
    authorize: builder.mutation<StateInstanceResponse, Instance>({
      query: (instance) => ({ apiMethod: 'getStateInstance', instance }),
    }),

    getStateInstance: builder.query<StateInstanceResponse, void>({
      query: () => ({ apiMethod: 'getStateInstance' }),
    }),

    getSettings: builder.query<InstanceSettings, void>({
      query: () => ({ apiMethod: 'getSettings' }),
      providesTags: ['Settings'],
    }),

    setSettings: builder.mutation<SetSettingsResponse, Partial<InstanceSettings>>({
      query: (body) => ({ apiMethod: 'setSettings', method: 'POST', body }),
      invalidatesTags: ['Settings'],
    }),

    getContacts: builder.query<Contact[], void>({
      query: () => ({ apiMethod: 'getContacts' }),
    }),

    /** Tells whether a phone number has a MAX account and, if so, the id of the chat with it. */
    checkAccount: builder.mutation<CheckAccountResponse, string>({
      query: (phone) => ({
        apiMethod: 'checkAccount',
        method: 'POST',
        body: { phoneNumber: Number(phone) },
      }),
    }),

    sendMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      query: (body) => ({ apiMethod: 'sendMessage', method: 'POST', body }),
    }),

    getChatHistory: builder.query<JournalMessage[], string>({
      query: (chatId) => ({
        apiMethod: 'getChatHistory',
        method: 'POST',
        body: { chatId, count: HISTORY_PAGE_SIZE },
      }),
    }),

    /** Both message journals in one request: together they describe the recent chats. */
    getRecentMessages: builder.query<JournalMessage[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const params = { minutes: RECENT_MESSAGES_WINDOW_MINUTES };
        const [incoming, outgoing] = await Promise.all([
          baseQuery({ apiMethod: 'lastIncomingMessages', params }),
          baseQuery({ apiMethod: 'lastOutgoingMessages', params }),
        ]);
        const error = incoming.error ?? outgoing.error;

        if (error) {
          return { error };
        }

        return {
          data: [...(incoming.data as JournalMessage[]), ...(outgoing.data as JournalMessage[])],
        };
      },
    }),

    receiveNotification: builder.mutation<ReceiveNotificationResponse, void>({
      query: () => ({
        apiMethod: 'receiveNotification',
        params: { receiveTimeout: RECEIVE_TIMEOUT_SECONDS },
        timeout: RECEIVE_REQUEST_TIMEOUT_MS,
      }),
    }),

    deleteNotification: builder.mutation<DeleteNotificationResponse, number>({
      query: (receiptId) => ({
        apiMethod: 'deleteNotification',
        method: 'DELETE',
        pathParam: receiptId,
      }),
    }),
  }),
});

export const {
  useAuthorizeMutation,
  useGetStateInstanceQuery,
  useGetSettingsQuery,
  useSetSettingsMutation,
  useGetContactsQuery,
  useCheckAccountMutation,
  useSendMessageMutation,
  useGetChatHistoryQuery,
  useGetRecentMessagesQuery,
} = greenApiEndpoints;
