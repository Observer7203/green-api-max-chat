import clsx from 'clsx';
import { useEffect } from 'react';

import { Conversation } from '@/components/conversation/conversation.component';
import { Sidebar } from '@/components/sidebar/sidebar.component';
import { Backdrop } from '@/components/ui/backdrop.component';
import { useAppSelector } from '@/hooks/redux.hook';
import { useNotifications } from '@/hooks/use-notifications.hook';
import { selectActiveChatId, selectUnreadCount } from '@/store/slices/chat.slice';

import styles from './chat.page.module.css';

const APP_TITLE = 'Green Chat';

export const ChatPage = () => {
  const activeChatId = useAppSelector(selectActiveChatId);
  const unreadCount = useAppSelector(selectUnreadCount);

  useNotifications();

  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) ${APP_TITLE}` : APP_TITLE;

    return () => {
      document.title = APP_TITLE;
    };
  }, [unreadCount]);

  return (
    // On a narrow screen only one pane fits: the chat list, or the chat once it is open.
    <div className={clsx(styles.layout, activeChatId && styles.chatOpen)}>
      <Sidebar className={styles.sidebar} />
      <main className={styles.main}>
        {activeChatId ? (
          // The key resets the draft and the scroll position when another chat is opened.
          <Conversation key={activeChatId} chatId={activeChatId} />
        ) : (
          <Backdrop className={styles.placeholder}>
            <p className={styles.hint}>Выберите чат или начните новый по номеру телефона</p>
          </Backdrop>
        )}
      </main>
    </div>
  );
};
