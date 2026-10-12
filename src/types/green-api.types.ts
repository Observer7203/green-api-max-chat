/** Contracts of the GREEN-API HTTP API for MAX — only the fields this app reads or sends. */

/** Credentials of an instance, as shown in the GREEN-API console. */
export interface Instance {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export type StateInstance =
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'sleepMode'
  | 'starting'
  | 'yellowCard'
  | 'pendingCode'
  | 'suspended';

export interface StateInstanceResponse {
  stateInstance: StateInstance;
}

export type Flag = 'yes' | 'no';

export interface InstanceSettings {
  /** The messenger behind the instance; `v3` stands for MAX. */
  typeInstance?: string;
  /** When set, notifications are pushed to this URL instead of the HTTP API queue. */
  webhookUrl: string;
  /** Incoming messages. */
  incomingWebhook: Flag;
  /** Delivery statuses of outgoing messages. */
  outgoingWebhook: Flag;
  /** Messages sent from the phone itself. */
  outgoingMessageWebhook: Flag;
}

export interface SetSettingsResponse {
  saveSettings: boolean;
}

/** An entry of `getContacts`: a person from the address book. */
export interface Contact {
  chatId: string;
  /** The name from the MAX profile. */
  name: string;
  /** The name from the address book of the phone. */
  contactName?: string;
  /** Digits with the country code; `0` when the number is unknown. */
  phoneNumber?: number;
}

export interface CheckAccountResponse {
  /** Whether the phone number has a MAX account. */
  exist: boolean;
  /** The id of the chat with that account — the only way to learn it from a phone number. */
  chatId: string;
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
}

export interface SendMessageResponse {
  idMessage: string;
}

export type OutgoingStatus =
  'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'noAccount' | 'notInGroup' | 'yellowCard';

/** An entry of `getChatHistory`, `lastIncomingMessages` and `lastOutgoingMessages`. */
export interface JournalMessage {
  type: 'incoming' | 'outgoing';
  idMessage: string;
  /** Unix time in seconds. */
  timestamp: number;
  typeMessage: string;
  chatId: string;
  textMessage?: string;
  extendedTextMessage?: { text?: string };
  caption?: string;
  statusMessage?: OutgoingStatus;
  senderName?: string;
  senderContactName?: string;
}

export interface MessageData {
  typeMessage: string;
  textMessageData?: { textMessage: string };
  extendedTextMessageData?: { text: string };
  fileMessageData?: { caption?: string };
}

export interface MessageNotification {
  typeWebhook: 'incomingMessageReceived' | 'outgoingMessageReceived' | 'outgoingAPIMessageReceived';
  /** Unix time in seconds. */
  timestamp: number;
  idMessage: string;
  senderData: {
    chatId: string;
    sender: string;
    chatName?: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number;
  };
  messageData: MessageData;
}

export interface StatusNotification {
  typeWebhook: 'outgoingMessageStatus';
  timestamp: number;
  chatId: string;
  idMessage: string;
  status: OutgoingStatus;
}

/** Notifications that arrive through the same queue but are not shown in the chat. */
export interface OtherNotification {
  typeWebhook: 'stateInstanceChanged' | 'incomingCall' | 'incomingBlock';
  timestamp: number;
}

export type NotificationBody = MessageNotification | StatusNotification | OtherNotification;

export interface Notification {
  /** Identifies the notification in the queue; pass it to `deleteNotification`. */
  receiptId: number;
  body: NotificationBody;
}

/** `null` means the queue stayed empty for the whole `receiveTimeout`. */
export type ReceiveNotificationResponse = Notification | null;

export interface DeleteNotificationResponse {
  result: boolean;
}
