/** The shared host of the MAX API; an instance may have its own, shown in the console. */
export const DEFAULT_API_URL = 'https://api.green-api.com/v3';

/** The console shows the host with a trailing slash; URLs are built without it. */
export const normalizeApiUrl = (url: string): string => url.trim().replace(/\/+$/, '');

export const isValidApiUrl = (url: string): boolean => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};
