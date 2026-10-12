import type {
  ChatDetails,
  JournalMessage,
  Message,
  MessageNotification,
  MessageStatus,
  OutgoingStatus,
} from '@/types';

import { isGroupChat } from './chat.utils';

const ATTACHMENT_LABELS: Record<string, string> = {
  imageMessage: '📷 Фото',
  videoMessage: '🎥 Видео',
  audioMessage: '🎤 Аудио',
  documentMessage: '📄 Документ',
  stickerMessage: 'Стикер',
  locationMessage: '📍 Геопозиция',
  contactMessage: '👤 Контакт',
  pollMessage: '📊 Опрос',
};

const UNSUPPORTED_LABEL = 'Сообщение этого типа пока не поддерживается';

/** Events about another message (a reaction, an edit…) rather than messages of their own. */
const SERVICE_TYPES = new Set([
  'reactionMessage',
  'editedMessage',
  'deletedMessage',
  'pollUpdateMessage',
]);

const STATUS_RANK: Record<MessageStatus, number> = {
  pending: 0,
  sent: 1,
  failed: 2,
  delivered: 3,
  read: 4,
};

const toMilliseconds = (seconds: number): number => seconds * 1000;

const describeMessage = (typeMessage: string, text?: string): string =>
  text || ATTACHMENT_LABELS[typeMessage] || UNSUPPORTED_LABEL;

export const toMessageStatus = (status: OutgoingStatus | undefined): MessageStatus => {
  switch (status) {
    case 'pending':
    case 'delivered':
    case 'read':
      return status;
    case 'failed':
    case 'noAccount':
    case 'notInGroup':
    case 'yellowCard':
      return 'failed';
    default:
      return 'sent';
  }
};

/**
 * Statuses arrive from several sources (send response, notifications, history) in no
 * guaranteed order, so a status only ever moves forward: "read" is never replaced by "delivered".
 */
export const pickLatestStatus = (
  current: MessageStatus | undefined,
  next: MessageStatus
): MessageStatus => (current && STATUS_RANK[current] >= STATUS_RANK[next] ? current : next);

export const toMessageFromNotification = (notification: MessageNotification): Message | null => {
  const { typeWebhook, idMessage, timestamp, senderData, messageData } = notification;

  if (SERVICE_TYPES.has(messageData.typeMessage)) {
    return null;
  }

  const isIncoming = typeWebhook === 'incomingMessageReceived';
  const text =
    messageData.textMessageData?.textMessage ??
    messageData.extendedTextMessageData?.text ??
    messageData.fileMessageData?.caption;

  const message: Message = {
    id: idMessage,
    chatId: senderData.chatId,
    direction: isIncoming ? 'incoming' : 'outgoing',
    text: describeMessage(messageData.typeMessage, text),
    timestamp: toMilliseconds(timestamp),
  };

  if (isIncoming) {
    message.senderName = senderData.senderName;
  } else {
    message.status = 'sent';
  }
  return message;
};

export const toMessageFromJournal = (entry: JournalMessage): Message | null => {
  if (SERVICE_TYPES.has(entry.typeMessage)) {
    return null;
  }

  const message: Message = {
    id: entry.idMessage,
    chatId: entry.chatId,
    direction: entry.type,
    text: describeMessage(
      entry.typeMessage,
      entry.textMessage ?? entry.extendedTextMessage?.text ?? entry.caption
    ),
    timestamp: toMilliseconds(entry.timestamp),
  };

  if (entry.type === 'incoming') {
    message.senderName = entry.senderContactName || entry.senderName;
  } else {
    message.status = toMessageStatus(entry.statusMessage);
  }
  return message;
};

/**
 * What a notification tells about its chat. Only an incoming message in a private chat
 * describes the other person: in a group, and in outgoing messages, the sender is someone else.
 */
export const getChatDetailsFromNotification = ({
  typeWebhook,
  senderData,
}: MessageNotification): ChatDetails => {
  const isFromChatPartner =
    typeWebhook === 'incomingMessageReceived' && !isGroupChat(senderData.chatId);

  if (!isFromChatPartner) {
    return { name: senderData.chatName || undefined };
  }

  return {
    name: senderData.chatName || senderData.senderContactName || senderData.senderName || undefined,
    phone: senderData.senderPhoneNumber ? String(senderData.senderPhoneNumber) : undefined,
  };
};

export const getChatDetailsFromJournal = (entry: JournalMessage): ChatDetails => {
  const isFromChatPartner = entry.type === 'incoming' && !isGroupChat(entry.chatId);

  return {
    name: (isFromChatPartner && (entry.senderContactName || entry.senderName)) || undefined,
  };
};
