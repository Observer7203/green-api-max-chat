import { useCallback } from 'react';

import { Alert } from '@/components/ui/alert.component';
import { Avatar } from '@/components/ui/avatar.component';
import { Backdrop } from '@/components/ui/backdrop.component';
import { Button } from '@/components/ui/button.component';
import { BackIcon } from '@/components/ui/icons';
import { useAppDispatch, useAppSelector } from '@/hooks/redux.hook';
import {
  useGetChatHistoryQuery,
  useSendMessageMutation,
} from '@/services/green-api/green-api.endpoints';
import { chatActions, selectChat, selectMessages } from '@/store/slices/chat.slice';
import type { Message } from '@/types';
import { getChatTitle, isGroupChat } from '@/utils/chat.utils';
import { formatPhone } from '@/utils/phone.utils';

import styles from './conversation.module.css';
import { MessageForm } from './message-form.component';
import { MessageList } from './message-list.component';

export const Conversation = ({ chatId }: { chatId: string }) => {
  const dispatch = useAppDispatch();
  const chat = useAppSelector((state) => selectChat(state, chatId));
  const messages = useAppSelector((state) => selectMessages(state, chatId));
  // The history is not rendered from here: the chat slice merges it with live messages.
  const { isLoading, isError, isFetching, refetch } = useGetChatHistoryQuery(chatId);
  const [sendMessage] = useSendMessageMutation();

  const isGroup = isGroupChat(chatId);
  const title = getChatTitle(chat ?? { chatId });
  const subtitle = isGroup ? 'Групповой чат' : chat?.phone && formatPhone(chat.phone);

  const handleRetry = useCallback(
    ({ id, text }: Message) => {
      dispatch(chatActions.messageDiscarded({ chatId, id }));
      void sendMessage({ chatId, message: text });
    },
    [chatId, dispatch, sendMessage]
  );

  return (
    <section className={styles.conversation} aria-label={`Чат: ${title}`}>
      <header className={styles.header}>
        <Button
          variant="icon"
          className={styles.back}
          aria-label="К списку чатов"
          onClick={() => dispatch(chatActions.chatClosed())}
        >
          <BackIcon />
        </Button>
        <Avatar name={title} />
        <div className={styles.title}>
          <h2 className={styles.name}>{title}</h2>
          {/* A chat that is still named by its number would show the number twice. */}
          {subtitle && subtitle !== title && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </header>

      <Backdrop className={styles.body}>
        {isError && (
          <div className={styles.alert}>
            <Alert
              action={
                <Button variant="secondary" isLoading={isFetching} onClick={() => refetch()}>
                  Повторить
                </Button>
              }
            >
              Не удалось загрузить историю чата.
            </Alert>
          </div>
        )}

        <MessageList
          messages={messages}
          isGroup={isGroup}
          isLoading={isLoading}
          onRetry={handleRetry}
        />
        <MessageForm chatId={chatId} />
      </Backdrop>
    </section>
  );
};
