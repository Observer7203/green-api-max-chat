import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert.component';
import { Button } from '@/components/ui/button.component';
import { TextField } from '@/components/ui/text-field.component';
import { useAppDispatch, useAppSelector } from '@/hooks/redux.hook';
import { greenApiEndpoints, useAuthorizeMutation } from '@/services/green-api/green-api.endpoints';
import { authActions, selectSessionExpired } from '@/store/slices/auth.slice';
import type { Instance } from '@/types';
import { getErrorMessage } from '@/utils/error.utils';

import styles from './auth-form.module.css';

const readInstance = (form: FormData): Instance => ({
  idInstance: String(form.get('idInstance')).trim(),
  apiTokenInstance: String(form.get('apiTokenInstance')).trim(),
});

export const AuthForm = () => {
  const dispatch = useAppDispatch();
  const sessionExpired = useAppSelector(selectSessionExpired);
  const [authorize, { isLoading, error }] = useAuthorizeMutation();
  const [isComplete, setIsComplete] = useState(false);
  const [idError, setIdError] = useState<string>();

  // The inputs stay uncontrolled: the form only needs to know whether both are filled in,
  // to keep the button inactive until then.
  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    const { idInstance, apiTokenInstance } = readInstance(new FormData(event.currentTarget));

    setIsComplete(idInstance !== '' && apiTokenInstance !== '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const instance = readInstance(form);
    const isIdValid = /^\d+$/.test(instance.idInstance);

    setIdError(isIdValid ? undefined : 'idInstance состоит только из цифр');
    if (!isIdValid) {
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
    <form className={styles.form} onChange={handleChange} onSubmit={handleSubmit} noValidate>
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
        error={idError}
        autoFocus
      />
      <TextField
        label="apiTokenInstance"
        name="apiTokenInstance"
        type="password"
        autoComplete="off"
      />

      <label className={styles.remember}>
        <input type="checkbox" name="remember" />
        Запомнить на этом устройстве
      </label>

      <Button type="submit" className={styles.submit} disabled={!isComplete} isLoading={isLoading}>
        Войти
      </Button>
    </form>
  );
};
