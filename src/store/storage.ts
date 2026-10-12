import type { Instance } from '@/types';

const STORAGE_KEY = 'green-chat:instance';
const INSTANCE_FIELDS = ['apiUrl', 'idInstance', 'apiTokenInstance'] as const;

const isInstance = (value: unknown): value is Instance =>
  typeof value === 'object' &&
  value !== null &&
  INSTANCE_FIELDS.every((field) => typeof (value as Record<string, unknown>)[field] === 'string');

/** Storage can throw (private mode, disabled cookies), and the app must keep working without it. */
const ignoreStorageErrors = (action: () => void): void => {
  try {
    action();
  } catch (error) {
    console.warn('Browser storage is unavailable', error);
  }
};

export const loadInstance = (): Instance | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;

    return isInstance(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearInstance = (): void =>
  ignoreStorageErrors(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  });

/** Without `remember` the credentials live only until the tab is closed. */
export const saveInstance = (instance: Instance, remember: boolean): void => {
  clearInstance();
  ignoreStorageErrors(() => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(instance));
  });
};
