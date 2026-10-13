import clsx from 'clsx';

import { InstanceAlerts } from '@/components/alerts/instance-alerts.component';
import { useAppSelector } from '@/hooks/redux.hook';
import {
  useGetContactsQuery,
  useGetRecentMessagesQuery,
} from '@/services/green-api/green-api.endpoints';
import { selectIsOffline } from '@/store/slices/chat.slice';

import { ChatList } from './chat-list.component';
import { InstanceInfo } from './instance-info.component';
import { NewChatForm } from './new-chat-form.component';
import styles from './sidebar.module.css';

/** How often the journals are re-read while the notification queue cannot be read. */
const JOURNAL_POLLING_INTERVAL_MS = 5_000;

export const Sidebar = ({ className }: { className?: string }) => {
  const isOffline = useAppSelector(selectIsOffline);

  // The responses are not rendered from here: the chat slice turns them into the chat list.
  // New messages normally come from the notification queue. While GREEN-API fails to serve
  // it, the journals are re-read instead, so that the chat does not go silent.
  const { isLoading } = useGetRecentMessagesQuery(undefined, {
    pollingInterval: isOffline ? JOURNAL_POLLING_INTERVAL_MS : 0,
  });
  useGetContactsQuery();

  return (
    <aside className={clsx(styles.sidebar, className)}>
      <InstanceInfo />
      <InstanceAlerts />
      <NewChatForm />
      <ChatList isLoading={isLoading} />
    </aside>
  );
};
