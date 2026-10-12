import { AuthForm } from '@/components/auth/auth-form.component';
import { Backdrop } from '@/components/ui/backdrop.component';
import { ChatIcon } from '@/components/ui/icons';

import styles from './auth.page.module.css';

export const AuthPage = () => (
  <Backdrop className={styles.page}>
    <main className={styles.card}>
      <header className={styles.header}>
        <p className={styles.brand}>
          <span className={styles.logo}>
            <ChatIcon width={22} height={22} />
          </span>
          Green Chat
        </p>
        <h1 className={styles.title}>Войдите по данным инстанса GREEN-API</h1>
        <p className={styles.subtitle}>
          Нужен инстанс MAX. Его данные указаны в{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личном кабинете
          </a>
          .
        </p>
      </header>

      <AuthForm />

      <p className={styles.note}>
        Данные инстанса хранятся только в вашем браузере и передаются напрямую в GREEN-API.
      </p>
    </main>
  </Backdrop>
);
