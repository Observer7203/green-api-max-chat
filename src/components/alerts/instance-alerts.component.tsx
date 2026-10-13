import { Alert } from '@/components/ui/alert.component';
import { Button } from '@/components/ui/button.component';
import { useAppSelector } from '@/hooks/redux.hook';
import {
  useGetSettingsQuery,
  useGetStateInstanceQuery,
  useSetSettingsMutation,
} from '@/services/green-api/green-api.endpoints';
import { selectIsOffline } from '@/store/slices/chat.slice';
import type { InstanceSettings } from '@/types';

import styles from './instance-alerts.module.css';

/** Without these notifications the chat shows no replies, statuses or messages from the phone. */
const REQUIRED_SETTINGS = {
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
} satisfies Partial<InstanceSettings>;

const REQUIRED_SETTING_NAMES = Object.keys(REQUIRED_SETTINGS) as (keyof typeof REQUIRED_SETTINGS)[];

/** How GREEN-API labels a MAX instance in its settings. */
const MAX_INSTANCE_TYPE = 'v3';

const ConnectionAlert = () => {
  const isOffline = useAppSelector(selectIsOffline);

  return isOffline ? (
    <Alert tone="danger">GREEN-API не отдаёт уведомления. Повторяем попытку…</Alert>
  ) : null;
};

const AuthorizationAlert = () => {
  const { data } = useGetStateInstanceQuery();

  if (!data || data.stateInstance === 'authorized') {
    return null;
  }

  return (
    <Alert>
      Инстанс не авторизован. Привяжите телефон в личном кабинете GREEN-API, иначе сообщения не
      будут отправляться.
    </Alert>
  );
};

const InstanceTypeAlert = () => {
  const { data: settings } = useGetSettingsQuery();

  if (!settings?.typeInstance || settings.typeInstance === MAX_INSTANCE_TYPE) {
    return null;
  }

  return (
    <Alert>
      Это инстанс другого мессенджера, а чат рассчитан на MAX. Новые чаты и отправка могут не
      работать.
    </Alert>
  );
};

const SettingsAlert = () => {
  const { data: settings } = useGetSettingsQuery();
  const [setSettings, { isLoading, isSuccess, isError }] = useSetSettingsMutation();

  if (!settings) {
    return null;
  }

  if (settings.webhookUrl) {
    return (
      <Alert>
        В настройках инстанса задан Webhook URL: уведомления уходят на него и в этот чат не
        попадают.
      </Alert>
    );
  }

  if (REQUIRED_SETTING_NAMES.some((name) => settings[name] !== REQUIRED_SETTINGS[name])) {
    return (
      <Alert
        action={
          <Button
            variant="secondary"
            isLoading={isLoading}
            onClick={() => setSettings(REQUIRED_SETTINGS)}
          >
            Включить
          </Button>
        }
      >
        {isError
          ? 'Не удалось сохранить настройки. Попробуйте ещё раз.'
          : 'В настройках инстанса выключены уведомления: входящие сообщения и статусы доставки не появятся.'}
      </Alert>
    );
  }

  return isSuccess ? (
    <Alert>Уведомления включены. Инстанс применяет настройки до 5 минут.</Alert>
  ) : null;
};

/** Everything that can keep the chat from working, each with a way out where there is one. */
export const InstanceAlerts = () => (
  <div className={styles.alerts}>
    <ConnectionAlert />
    <AuthorizationAlert />
    <InstanceTypeAlert />
    <SettingsAlert />
  </div>
);
