import { describe, expect, it } from 'vitest';

import { getChatTitle, isGroupChat } from './chat.utils';

describe('isGroupChat', () => {
  it('tells group chats from private ones by the sign of the id', () => {
    expect(isGroupChat('-10000000000001')).toBe(true);
    expect(isGroupChat('100000001')).toBe(false);
  });
});

describe('getChatTitle', () => {
  it('prefers the name of the chat', () => {
    expect(getChatTitle({ chatId: '100000001', name: 'Анна', phone: '79991234567' })).toBe('Анна');
  });

  it('falls back to the phone number', () => {
    expect(getChatTitle({ chatId: '100000001', phone: '79991234567' })).toBe('+79991234567');
  });

  it('still names a chat about which nothing is known', () => {
    expect(getChatTitle({ chatId: '100000001' })).toBe('Чат 100000001');
    expect(getChatTitle({ chatId: '-10000000000001' })).toBe('Группа');
  });
});
