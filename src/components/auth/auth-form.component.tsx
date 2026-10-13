import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert.component';
import { Button } from '@/components/ui/button.component';
import { TextField } from '@/components/ui/text-field.component';
import { useAppDispatch, useAppSelector } from '@/hooks/redux.hook';
import { greenApiEndpoints, useAuthorizeMutation } from '@/services/green-api/green-api.endpoints';
import { authActions, selectSessionExpired } from '@/store/slices/auth.slice';
import type { Instance } from '@/types';
import { getErrorMessage } from '@/utils/error.utils';
import { DEFAULT_API_URL, isValidApiUrl, normalizeApiUrl } from '@/utils/instance.utils';

import styles from './auth-form.module.css';

type FormErrors = Partial<Record<keyof Instance, string>>;

const validate = ({ idInstance, apiTokenInstance, apiUrl }: Instance): FormErrors => {
  const errors: FormErrors = {};

  if (!/^\d+$/.test(idInstance)) {
    errors.idInstance = 'idInstance состоит только из цифр';
  }
  if (!apiTokenInstance) {
    errors.apiTokenInstance = 'Введите apiTokenInstance';
  }
  if (!isValidApiUrl(apiUrl)) {
    errors.apiUrl = `Введите адрес вида ${DEFAULT_API_URL}`;
  }
  return errors;
};

export const AuthForm = () => {
  const dispatch = useAppDispatch();
  const sessionExpired = useAppSelector(selectSessionExpired);
  const [authorize, { isLoading, error }] = useAuthorizeMutation();
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const instance: Instance = {
      idInstance: String(form.get('idInstance')).trim(),
      apiTokenInstance: String(form.get('apiTokenInstance')).trim(),
      apiUrl: normalizeApiUrl(String(form.get('apiUrl'))),
    };
    const validationErrors = validate(instance);

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Credentials are stored only after GREEN-API has accepted them.
    const { data: state } = await authorize(instance);

    if (state) {
      // The answer is also the first reading of the instance state. Asking for it again
      // right after login would exceed the limit of one such request per second.
      dispatch(greenApiEndpoints.util.upsertQueryData('getStateInstance', undefined, state));
      dispatch(authActions.loggedIn({ instance, remember: form.get('remember') === 'on' }));
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {sessionExpired && !error && (
        <Alert>GREEN-API больше не принимает сохранённый токен. Войдите заново.</Alert>
      )}
      {error && <Alert tone="danger">{getErrorMessage(error)}</Alert>}

      <TextField
        label="idInstance"
        name="idInstance"
        inputMode="numeric"
        autoComplete="off"
        placeholder="3100000001"
        error={errors.idInstance}
        autoFocus
      />
      <TextField
        label="apiTokenInstance"
        name="apiTokenInstance"
        type="password"
        autoComplete="off"
        error={errors.apiTokenInstance}
      />
      <TextField
        label="Адрес API"
        name="apiUrl"
        type="url"
        defaultValue={DEFAULT_API_URL}
        hint="Поле apiUrl в личном кабинете"
        error={errors.apiUrl}
      />

      <label className={styles.remember}>
        <input type="checkbox" name="remember" />
        Запомнить на этом устройстве
      </label>

      <Button type="submit" className={styles.submit} isLoading={isLoading}>
        Войти
      </Button>
    </form>
  );
};
