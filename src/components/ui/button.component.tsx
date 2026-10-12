import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

import styles from './button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
  isLoading?: boolean;
}

export const Button = ({
  variant = 'primary',
  isLoading = false,
  type = 'button',
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={clsx(styles.button, styles[variant], className)}
    disabled={disabled || isLoading}
    aria-busy={isLoading || undefined}
    {...props}
  >
    {isLoading && <span className={styles.spinner} aria-hidden="true" />}
    {children}
  </button>
);
