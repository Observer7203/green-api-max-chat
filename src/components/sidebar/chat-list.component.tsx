import clsx from 'clsx';

import { MessageStatus } from '@/components/conversation/message-status.component';
import { Avatar } from '@/components/ui/avatar.component';
import { useAppDispatch, useAppSelector } from '@/hooks/redux.hook';
import { chatActions, selectActiveChatId, selectChatPreviews } from '@/store/slices/chat.slice';
import type { ChatPreview } from '@/types';
import { formatChatTime } from '@/utils/date.utils';

import styles from './chat-list.module.css';

interface ChatListItemProps {
  chat: ChatPreview;
  isActive: boolean;
  onSelect: (chatId: string) => void;
}

const ChatListItem = ({ chat, isActive, onSelect }: ChatListItemProps) => {
  const { chatId, title, unreadCount, lastMessage } = chat;

  return (
    <button
      type="button"
      className={clsx(styles.item, isActive && styles.active)}
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect(chatId)}
    >
      <Avatar name={title} seed={chatId} />
      <span className={styles.body}>
        <span className={styles.row}>
          <span className={styles.name}>{title}</span>
          {lastMessage && (
            <time className={styles.time}>{formatChatTime(lastMessage.timestamp)}</time>
          )}
        </span>
        <span className={styles.row}>
          <span className={styles.preview}>
            {lastMessage?.status && <MessageStatus status={lastMessage.status} />}
            <span className={styles.previewText}>{lastMessage?.text ?? 'Нет сообщений'}</span>
          </span>
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount}
              <span className="visually-hidden"> непрочитанных</span>
            </span>
          )}
        </span>
      </span>
    </button>
  );
};

export const ChatList = ({ isLoading }: { isLoading: boolean }) => {
  const dispatch = useAppDispatch();
  const chats = useAppSelector(selectChatPreviews);
  const activeChatId = useAppSelector(selectActiveChatId);

  if (chats.length === 0) {
    return (
      <p className={styles.empty}>
        {isLoading
          ? 'Загружаем чаты…'
          : 'За последние сутки переписки не было. Введите номер, чтобы начать чат.'}
      </p>
    );
  }

  return (
    <nav className={styles.list} aria-label="Чаты">
      <ul>
        {chats.map((chat) => (
          <li key={chat.chatId}>
            <ChatListItem
              chat={chat}
              isActive={chat.chatId === activeChatId}
              onSelect={(chatId) => dispatch(chatActions.chatOpened(chatId))}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
};
