import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button.component';
import { PlusIcon } from '@/components/ui/icons';
import { TextField } from '@/components/ui/text-field.component';
import { useAppDispatch } from '@/hooks/redux.hook';
import { useCheckAccountMutation } from '@/services/green-api/green-api.endpoints';
import { chatActions } from '@/store/slices/chat.slice';
import { getErrorMessage } from '@/utils/error.utils';
import { isValidPhone, normalizePhone } from '@/utils/phone.utils';

import styles from './new-chat-form.module.css';

export const NewChatForm = () => {
  const dispatch = useAppDispatch();
  const [checkAccount, { isLoading }] = useCheckAccountMutation();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPhone = normalizePhone(phone);

    if (!isValidPhone(normalizedPhone)) {
      setError('Введите номер с кодом страны, например +7 999 123-45-67');
      return;
    }

    // MAX addresses a chat by its own id, and this request is the only way to get it from a
    // phone number. So, unlike a mere existence check, it cannot be skipped when it fails.
    const { data, error: requestError } = await checkAccount(normalizedPhone);

    if (!data) {
      setError(`Не удалось проверить номер. ${getErrorMessage(requestError)}`);
      return;
    }
    if (!data.exist) {
      setError('На этом номере нет MAX');
      return;
    }

    dispatch(chatActions.chatOpened(data.chatId, normalizedPhone));
    setPhone('');
    setError(undefined);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        className={styles.field}
        label="Номер телефона"
        isLabelHidden
        type="tel"
        autoComplete="off"
        placeholder="Новый чат: номер телефона"
        value={phone}
        error={error}
        onChange={(event) => {
          setPhone(event.target.value);
          setError(undefined);
        }}
      />
      <Button
        type="submit"
        variant="icon"
        className={styles.submit}
        isLoading={isLoading}
        aria-label="Начать чат"
        title="Начать чат"
      >
        {!isLoading && <PlusIcon />}
      </Button>
    </form>
  );
};
