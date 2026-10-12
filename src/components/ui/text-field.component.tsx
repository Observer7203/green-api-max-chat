import clsx from 'clsx';
import { useId, type InputHTMLAttributes } from 'react';

import styles from './text-field.module.css';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Keeps the label for screen readers only, when the placeholder already says enough. */
  isLabelHidden?: boolean;
  hint?: string;
  error?: string;
}

export const TextField = ({
  label,
  isLabelHidden = false,
  hint,
  error,
  className,
  ...props
}: TextFieldProps) => {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div className={clsx(styles.field, className)}>
      <label htmlFor={id} className={clsx(styles.label, isLabelHidden && 'visually-hidden')}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...props}
      />
      {message && (
        <p id={messageId} className={error ? styles.error : styles.hint}>
          {message}
        </p>
      )}
    </div>
  );
};
