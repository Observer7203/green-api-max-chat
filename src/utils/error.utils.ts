const FALLBACK_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз.';
const SERVER_ERROR_MESSAGE = 'Сервис GREEN-API временно недоступен. Попробуйте позже.';

const MESSAGES: Record<string, string> = {
  FETCH_ERROR: 'Нет связи с сервером. Проверьте интернет и idInstance.',
  TIMEOUT_ERROR: 'Сервер не ответил вовремя. Попробуйте ещё раз.',
  400: 'Сервер отклонил запрос. Проверьте введённые данные.',
  401: 'Неверный idInstance или apiTokenInstance.',
  403: 'Доступ запрещён. Проверьте idInstance и apiTokenInstance.',
  404: 'Инстанс не найден. Проверьте idInstance.',
  429: 'Слишком много запросов. Подождите немного и повторите.',
  466: 'Исчерпан лимит тарифа GREEN-API.',
};

const getStatus = (error: unknown): string | number | undefined => {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined;
  }
  const { status } = error;
  return typeof status === 'string' || typeof status === 'number' ? status : undefined;
};

/** Turns an RTK Query error into a message that can be shown to the user. */
export const getErrorMessage = (error: unknown): string => {
  const status = getStatus(error);

  if (status === undefined) {
    return FALLBACK_MESSAGE;
  }
  if (typeof status === 'number' && status >= 500) {
    return SERVER_ERROR_MESSAGE;
  }
  return MESSAGES[status] ?? FALLBACK_MESSAGE;
};
