import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './alert.module.css';

interface AlertProps {
  tone?: 'warning' | 'danger';
  /** A control that resolves the problem, e.g. a retry button. */
  action?: ReactNode;
  children: ReactNode;
}

export const Alert = ({ tone = 'warning', action, children }: AlertProps) => (
  <div className={clsx(styles.alert, styles[tone])} role={tone === 'danger' ? 'alert' : 'status'}>
    <p className={styles.text}>{children}</p>
    {action}
  </div>
);
