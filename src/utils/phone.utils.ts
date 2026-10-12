/**
 * Reduces user input to the digits GREEN-API expects (country code first, no "+").
 *
 * In Russia and Kazakhstan numbers are often written with the domestic "8" prefix
 * (8 999 123-45-67); it is replaced with the country code. An explicit "+" means the
 * number is already international, so "+84…" (Vietnam) is left untouched.
 */
export const normalizePhone = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  const isDomestic = !input.trim().startsWith('+') && digits.length === 11 && digits[0] === '8';

  return isDomestic ? `7${digits.slice(1)}` : digits;
};

/** E.164: up to 15 digits, the country code never starts with zero. */
export const isValidPhone = (phone: string): boolean => /^[1-9]\d{6,14}$/.test(phone);

export const formatPhone = (phone: string): string => `+${phone}`;
