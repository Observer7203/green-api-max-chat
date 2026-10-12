import clsx from 'clsx';
import { memo } from 'react';

import type { Message } from '@/types';
import { formatTime } from '@/utils/date.utils';

import styles from './message-bubble.module.css';
import { MessageStatus } from './message-status.component';

interface MessageBubbleProps {
  message: Message;
  /** In a group chat an incoming message is signed with the name of its author. */
  showSender: boolean;
  onRetry: (message: Message) => void;
}

export const MessageBubble = memo(({ message, showSender, onRetry }: MessageBubbleProps) => {
  const { direction, text, timestamp, status, error, senderName } = message;

  return (
    <li className={clsx(styles.message, styles[direction])}>
      <div className={styles.bubble}>
        {showSender && senderName && <span className={styles.sender}>{senderName}</span>}
        <p className={styles.text}>{text}</p>
        <span className={styles.meta}>
          <time dateTime={new Date(timestamp).toISOString()}>{formatTime(timestamp)}</time>
          {status && <MessageStatus status={status} />}
        </span>
      </div>

      {status === 'failed' && (
        <p className={styles.failure}>
          {error}{' '}
          <button type="button" className={styles.retry} onClick={() => onRetry(message)}>
            Повторить
          </button>
        </p>
      )}
    </li>
  );
});
