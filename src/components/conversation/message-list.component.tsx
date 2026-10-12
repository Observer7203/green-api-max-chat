import { Fragment, useLayoutEffect, useRef } from 'react';

import type { Message } from '@/types';
import { formatDay, isSameDay } from '@/utils/date.utils';

import { MessageBubble } from './message-bubble.component';
import styles from './message-list.module.css';

interface MessageListProps {
  messages: Message[];
  isGroup: boolean;
  isLoading: boolean;
  onRetry: (message: Message) => void;
}

/** How close to the bottom still counts as "reading the latest messages". */
const STICK_TO_BOTTOM_THRESHOLD_PX = 80;

export const MessageList = ({ messages, isGroup, isLoading, onRetry }: MessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const lastMessage = messages.at(-1);
  const isOwnMessageSending = lastMessage?.status === 'pending';

  const handleScroll = () => {
    const container = containerRef.current;

    if (container) {
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      isAtBottomRef.current = distanceToBottom < STICK_TO_BOTTOM_THRESHOLD_PX;
    }
  };

  // New messages scroll into view, unless the user has scrolled up to read older ones.
  // The user's own message always does: they have just sent it and expect to see it.
  useLayoutEffect(() => {
    const container = containerRef.current;

    if (container && (isAtBottomRef.current || isOwnMessageSending)) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, isOwnMessageSending]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      role="log"
      aria-label="Сообщения"
      tabIndex={0}
      onScroll={handleScroll}
    >
      {messages.length === 0 ? (
        <p className={styles.placeholder}>
          {isLoading ? (
            'Загружаем историю…'
          ) : (
            <>
              <strong>Сообщений пока нет</strong>
              Напишите первым
            </>
          )}
        </p>
      ) : (
        <ul className={styles.list}>
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const startsNewDay = !previous || !isSameDay(previous.timestamp, message.timestamp);

            return (
              <Fragment key={message.id}>
                {startsNewDay && (
                  <li className={styles.day}>
                    <span>{formatDay(message.timestamp)}</span>
                  </li>
                )}
                <MessageBubble message={message} showSender={isGroup} onRetry={onRetry} />
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
};
