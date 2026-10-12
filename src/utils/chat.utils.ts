import type { Chat } from '@/types';

import { formatPhone } from './phone.utils';

/** In MAX the id of a group chat is negative, the id of a private chat is positive. */
export const isGroupChat = (chatId: string): boolean => chatId.startsWith('-');

/** What to call a chat: its name if there is one, otherwise the best identifier at hand. */
export const getChatTitle = ({
  chatId,
  name,
  phone,
}: Pick<Chat, 'chatId' | 'name' | 'phone'>): string => {
  if (name) {
    return name;
  }
  if (phone) {
    return formatPhone(phone);
  }
  return isGroupChat(chatId) ? 'Группа' : `Чат ${chatId}`;
};
