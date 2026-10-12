export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  /** `idMessage` from GREEN-API, or the request id while the message is still being sent. */
  id: string;
  chatId: string;
  direction: 'incoming' | 'outgoing';
  text: string;
  /** Unix time in milliseconds. */
  timestamp: number;
  /** Outgoing messages only. */
  status?: MessageStatus;
  /** Why the message was not sent; set together with the `failed` status. */
  error?: string;
  /** Author of an incoming message — shown in group chats. */
  senderName?: string;
}

export interface Chat {
  /** The id MAX gives the chat. It is not the phone number and cannot be derived from it. */
  chatId: string;
  /** From the address book or from the messages; absent until one of them names the chat. */
  name?: string;
  /** Digits with the country code, when known. */
  phone?: string;
  unreadCount: number;
  /** Orders chats that have no messages yet. Unix time in milliseconds. */
  createdAt: number;
}

/** What can be learnt about a chat from outside: a notification, a journal, the address book. */
export type ChatDetails = Pick<Chat, 'name' | 'phone'>;

export interface ChatPreview extends Chat {
  /** What to call the chat on screen. */
  title: string;
  lastMessage?: Message;
}
