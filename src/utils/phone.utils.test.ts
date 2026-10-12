import { describe, expect, it } from 'vitest';

import { formatPhone, isValidPhone, normalizePhone } from './phone.utils';

describe('normalizePhone', () => {
  it('keeps only digits', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567');
  });

  it('replaces the domestic "8" prefix with the country code', () => {
    expect(normalizePhone('8 999 123-45-67')).toBe('79991234567');
  });

  it('trusts a number written with "+", even if it starts with 8', () => {
    expect(normalizePhone('+84 912 345 678')).toBe('84912345678');
  });
});

describe('isValidPhone', () => {
  it.each(['79991234567', '77011234567', '972501234567', '5511912345678'])(
    'accepts %s',
    (phone) => {
      expect(isValidPhone(phone)).toBe(true);
    }
  );

  it.each(['', '12345', '09991234567', '1234567890123456'])('rejects "%s"', (phone) => {
    expect(isValidPhone(phone)).toBe(false);
  });
});

describe('formatPhone', () => {
  it('shows a number in the international form', () => {
    expect(formatPhone('79991234567')).toBe('+79991234567');
  });
});
