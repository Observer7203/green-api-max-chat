import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { setupStore } from '@/store';
import { loadInstance } from '@/store/storage';
import { renderWithStore, stubGreenApi, TEST_INSTANCE } from '@/test/utils';
import type { InstanceSettings, JournalMessage } from '@/types';

import { App } from './app';

const SETTINGS: InstanceSettings = {
  webhookUrl: '',
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
};

const INCOMING: JournalMessage = {
  type: 'incoming',
  idMessage: 'A',
  timestamp: 1_700_000_000,
  typeMessage: 'textMessage',
  chatId: '100000001',
  textMessage: 'Привет из истории',
  senderName: 'Анна',
};

/** The API of a healthy instance with one recent chat; the notification queue stays silent. */
const stubInstance = (overrides: Parameters<typeof stubGreenApi>[0] = {}) =>
  stubGreenApi({
    getStateInstance: () => ({ stateInstance: 'authorized' }),
    getSettings: () => SETTINGS,
    getContacts: () => [],
    lastIncomingMessages: () => [INCOMING],
    lastOutgoingMessages: () => [],
    getChatHistory: () => [INCOMING],
    receiveNotification: () => new Promise(() => {}),
    ...overrides,
  });

const logIn = async (token = TEST_INSTANCE.apiTokenInstance) => {
  const user = userEvent.setup();
  const rendered = renderWithStore(<App />, setupStore());

  await user.type(screen.getByLabelText('idInstance'), TEST_INSTANCE.idInstance);
  await user.type(screen.getByLabelText('apiTokenInstance'), token);
  await user.click(screen.getByRole('button', { name: 'Войти' }));

  return { user, ...rendered };
};

describe('App', () => {
  it('logs in, lists recent chats and opens one with its history', async () => {
    stubInstance();

    const { user } = await logIn();

    await user.click(await screen.findByRole('button', { name: /Анна/ }));

    expect(screen.getByRole('heading', { name: 'Анна' })).toBeInTheDocument();
    expect(await screen.findByRole('log')).toHaveTextContent('Привет из истории');
  });

  it('keeps the credentials for the tab only, unless asked to remember them', async () => {
    stubInstance();

    await logIn();
    await screen.findByText('Авторизован');

    expect(loadInstance()).toEqual(TEST_INSTANCE);
    expect(localStorage).toHaveLength(0);
  });

  it('stays on the login form when GREEN-API rejects the credentials', async () => {
    stubInstance({ getStateInstance: () => Response.json({}, { status: 401 }) });

    await logIn('wrong-token');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Неверный idInstance или apiTokenInstance.'
    );
    expect(loadInstance()).toBeNull();
  });

  it('keeps the login button inactive until both fields are filled in', async () => {
    stubInstance();
    const user = userEvent.setup();
    renderWithStore(<App />, setupStore());
    const button = screen.getByRole('button', { name: 'Войти' });

    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText('idInstance'), TEST_INSTANCE.idInstance);
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText('apiTokenInstance'), 'token');
    expect(button).toBeEnabled();
  });

  it('rejects an idInstance that is not a number without sending anything', async () => {
    const fetchMock = stubInstance();
    const user = userEvent.setup();
    renderWithStore(<App />, setupStore());

    await user.type(screen.getByLabelText('idInstance'), '31OO');
    await user.type(screen.getByLabelText('apiTokenInstance'), 'token');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(screen.getByText('idInstance состоит только из цифр')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('offers to switch notifications on when the instance has them disabled', async () => {
    let settings: InstanceSettings = { ...SETTINGS, incomingWebhook: 'no' };
    stubInstance({
      getSettings: () => settings,
      setSettings: (body) => {
        settings = { ...settings, ...(body as Partial<InstanceSettings>) };
        return { saveSettings: true };
      },
    });

    const { user } = await logIn();

    await user.click(await screen.findByRole('button', { name: 'Включить' }));

    expect(await screen.findByText(/Уведомления включены/)).toBeInTheDocument();
    expect(settings.incomingWebhook).toBe('yes');
  });

  it('logs out and returns to the login form', async () => {
    stubInstance();

    const { user } = await logIn();

    await user.click(await screen.findByRole('button', { name: 'Выйти' }));

    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
    expect(loadInstance()).toBeNull();
  });
});
