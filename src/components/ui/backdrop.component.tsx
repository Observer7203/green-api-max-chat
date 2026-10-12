import clsx from 'clsx';
import type { ReactNode } from 'react';

import styles from './backdrop.module.css';

interface BackdropProps {
  className?: string;
  children: ReactNode;
}

/** The gradient with space doodles behind the login card and behind the messages. */
export const Backdrop = ({ className, children }: BackdropProps) => (
  <div className={clsx(styles.backdrop, className)}>{children}</div>
);
