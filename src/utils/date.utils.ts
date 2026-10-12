const LOCALE = 'ru-RU';
const DAY_MS = 24 * 60 * 60 * 1000;

const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

export const isSameDay = (first: number, second: number): boolean =>
  new Date(first).toDateString() === new Date(second).toDateString();

export const formatTime = (timestamp: number): string => timeFormat.format(timestamp);

/** A heading for a day of messages: "Сегодня", "Вчера" or a full date. */
export const formatDay = (timestamp: number, now = Date.now()): string => {
  if (isSameDay(timestamp, now)) {
    return 'Сегодня';
  }
  if (isSameDay(timestamp, now - DAY_MS)) {
    return 'Вчера';
  }
  return dayFormat.format(timestamp);
};

/** Compact form for the chat list: the time for today, a date for anything older. */
export const formatChatTime = (timestamp: number, now = Date.now()): string =>
  isSameDay(timestamp, now) ? formatTime(timestamp) : shortDateFormat.format(timestamp);
