import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { selectMessages } from '@/store/slices/chat.slice';
import { renderWithStore, stubGreenApi } from '@/test/utils';

import { MessageForm } from './message-form.component';

const CHAT_ID = '100000001';

const setup = () => {
  const fetchMock = stubGreenApi({ sendMessage: () => ({ idMessage: 'SERVER-ID' }) });
  const { store } = renderWithStore(<MessageForm chatId={CHAT_ID} />);

  return {
    fetchMock,
    store,
    user: userEvent.setup(),
    field: screen.getByRole('textbox', { name: 'Сообщение' }),
    sendButton: screen.getByRole('button', { name: 'Отправить' }),
  };
};

describe('MessageForm', () => {
  it('sends the message on Enter and clears the field', async () => {
    const { user, field, store } = setup();

    await user.type(field, '  Привет  {Enter}');

    expect(field).toHaveValue('');
    expect(selectMessages(store.getState(), CHAT_ID)).toMatchObject([{ text: 'Привет' }]);
  });

  it('breaks the line on Shift+Enter instead of sending', async () => {
    const { user, field, fetchMock } = setup();

    await user.type(field, 'Первая{Shift>}{Enter}{/Shift}Вторая');

    expect(field).toHaveValue('Первая\nВторая');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not send a message of spaces alone', async () => {
    const { user, field, sendButton, fetchMock } = setup();

    await user.type(field, '   {Enter}');

    expect(sendButton).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the message with the button', async () => {
    const { user, field, sendButton, fetchMock } = setup();

    await user.type(field, 'Привет');
    await user.click(sendButton);

    expect(await fetchMock.mock.calls[0][0].json()).toEqual({ chatId: CHAT_ID, message: 'Привет' });
  });
});
