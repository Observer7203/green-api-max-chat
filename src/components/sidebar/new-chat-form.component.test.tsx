import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { selectActiveChatId, selectChatPreviews } from '@/store/slices/chat.slice';
import { renderWithStore, stubGreenApi } from '@/test/utils';

import { NewChatForm } from './new-chat-form.component';

const startChat = async (phone: string) => {
  const user = userEvent.setup();
  const { store } = renderWithStore(<NewChatForm />);

  await user.type(screen.getByRole('textbox', { name: 'Номер телефона' }), phone);
  await user.click(screen.getByRole('button', { name: 'Начать чат' }));

  return store;
};

describe('NewChatForm', () => {
  it('opens the chat that MAX has for the number', async () => {
    const fetchMock = stubGreenApi({
      checkAccount: () => ({ exist: true, chatId: '100000001' }),
    });

    const store = await startChat('8 (999) 123-45-67');

    expect(selectActiveChatId(store.getState())).toBe('100000001');
    expect(selectChatPreviews(store.getState())).toMatchObject([{ title: '+79991234567' }]);
    expect(await fetchMock.mock.calls[0][0].json()).toEqual({ phoneNumber: 79991234567 });
  });

  it('rejects a number that is too short without asking the API', async () => {
    const fetchMock = stubGreenApi({});

    const store = await startChat('12345');

    expect(screen.getByText(/Введите номер с кодом страны/)).toBeInTheDocument();
    expect(selectActiveChatId(store.getState())).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not open a chat with a number that has no MAX account', async () => {
    stubGreenApi({ checkAccount: () => ({ exist: false, chatId: '' }) });

    const store = await startChat('+7 999 123-45-67');

    expect(screen.getByText('На этом номере нет MAX')).toBeInTheDocument();
    expect(selectActiveChatId(store.getState())).toBeNull();
  });

  it('explains why the chat cannot be opened when the check itself fails', async () => {
    stubGreenApi({ checkAccount: () => Response.json({}, { status: 466 }) });

    const store = await startChat('+7 999 123-45-67');

    expect(
      screen.getByText('Не удалось проверить номер. Исчерпан лимит тарифа GREEN-API.')
    ).toBeInTheDocument();
    expect(selectActiveChatId(store.getState())).toBeNull();
  });
});
