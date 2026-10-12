import clsx from 'clsx';
import type { ComponentType, SVGProps } from 'react';

import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from '@/components/ui/icons';
import type { MessageStatus as Status } from '@/types';

import styles from './message-status.module.css';

const STATUSES: Record<Status, { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  pending: { label: 'Отправляется', Icon: ClockIcon },
  sent: { label: 'Отправлено', Icon: CheckIcon },
  delivered: { label: 'Доставлено', Icon: DoubleCheckIcon },
  read: { label: 'Прочитано', Icon: DoubleCheckIcon },
  failed: { label: 'Не отправлено', Icon: AlertIcon },
};

export const MessageStatus = ({ status }: { status: Status }) => {
  const { label, Icon } = STATUSES[status];

  return (
    <span className={clsx(styles.status, styles[status])} title={label}>
      <Icon width={16} height={16} />
      <span className="visually-hidden">{label}</span>
    </span>
  );
};
