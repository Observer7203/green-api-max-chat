import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button.component';
import { SendIcon } from '@/components/ui/icons';
import { useSendMessageMutation } from '@/services/green-api/green-api.endpoints';

import styles from './message-form.module.css';

/** The limit of the `sendMessage` method. */
const MAX_MESSAGE_LENGTH = 4_000;

export const MessageForm = ({ chatId }: { chatId: string }) => {
  const [sendMessage] = useSendMessageMutation();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const message = text.trim();

  // Grows the field with its content; the CSS max-height turns the rest into scrolling.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  const submit = () => {
    if (!message) {
      return;
    }

    // Not awaited: the message shows up at once, and the chat slice tracks how sending goes.
    void sendMessage({ chatId, message });
    setText('');
    textareaRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter breaks the line. While an IME is composing, Enter belongs to it.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        rows={1}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder="Введите сообщение"
        aria-label="Сообщение"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Button
        type="submit"
        variant="icon"
        className={styles.send}
        disabled={!message}
        aria-label="Отправить"
        title="Отправить"
      >
        <SendIcon />
      </Button>
    </form>
  );
};
