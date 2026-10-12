import clsx from 'clsx';

import { Button } from '@/components/ui/button.component';
import { LogoutIcon } from '@/components/ui/icons';
import { useAppDispatch, useAppSelector } from '@/hooks/redux.hook';
import { useGetStateInstanceQuery } from '@/services/green-api/green-api.endpoints';
import { authActions, selectInstance } from '@/store/slices/auth.slice';
import type { StateInstance } from '@/types';

import styles from './instance-info.module.css';

const STATE_POLLING_INTERVAL_MS = 30_000;

const STATE_LABELS: Record<StateInstance, string> = {
  authorized: 'Авторизован',
  notAuthorized: 'Не авторизован',
  blocked: 'Заблокирован',
  sleepMode: 'Спящий режим',
  starting: 'Запускается',
  yellowCard: 'Жёлтая карточка',
  pendingCode: 'Ожидает код',
  suspended: 'Приостановлен',
};

export const InstanceInfo = () => {
  const dispatch = useAppDispatch();
  const instance = useAppSelector(selectInstance);
  const { data } = useGetStateInstanceQuery(undefined, {
    pollingInterval: STATE_POLLING_INTERVAL_MS,
    skipPollingIfUnfocused: true,
  });
  const state = data?.stateInstance;

  return (
    <header className={styles.header}>
      <div className={styles.info}>
        <h1 className={styles.title}>Чаты</h1>
        <p className={styles.state}>
          <span className={clsx(styles.dot, state === 'authorized' && styles.online)} />
          <span>{state ? STATE_LABELS[state] : 'Проверяем состояние…'}</span>
          <span className={styles.instance}>· инстанс {instance?.idInstance}</span>
        </p>
      </div>
      <Button
        variant="icon"
        aria-label="Выйти"
        title="Выйти"
        onClick={() => dispatch(authActions.loggedOut())}
      >
        <LogoutIcon />
      </Button>
    </header>
  );
};
