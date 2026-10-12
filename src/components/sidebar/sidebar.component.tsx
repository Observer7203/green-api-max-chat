import clsx from 'clsx';

import { InstanceAlerts } from '@/components/alerts/instance-alerts.component';
import {
  useGetContactsQuery,
  useGetRecentMessagesQuery,
} from '@/services/green-api/green-api.endpoints';

import { ChatList } from './chat-list.component';
import { InstanceInfo } from './instance-info.component';
import { NewChatForm } from './new-chat-form.component';
import styles from './sidebar.module.css';

export const Sidebar = ({ className }: { className?: string }) => {
  // The responses are not rendered from here: the chat slice turns them into the chat list.
  const { isLoading } = useGetRecentMessagesQuery();
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
