import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import type { RootState } from '@/store';
import { authActions, selectInstance } from '@/store/slices/auth.slice';
import type { Instance } from '@/types';

export interface GreenApiRequest extends Omit<FetchArgs, 'url'> {
  /** GREEN-API method name, e.g. `sendMessage`. */
  apiMethod: string;
  /** Path segment that follows the token, e.g. `receiptId` of `deleteNotification`. */
  pathParam?: string | number;
  /** Credentials to use instead of the stored ones — to check an instance before login. */
  instance?: Instance;
}

const REQUEST_TIMEOUT_MS = 15_000;

const fetchQuery = fetchBaseQuery({ timeout: REQUEST_TIMEOUT_MS });

export const buildUrl = (
  { apiUrl, idInstance, apiTokenInstance }: Instance,
  apiMethod: string,
  pathParam?: string | number
): string => {
  const url = `${apiUrl}/waInstance${idInstance}/${apiMethod}/${apiTokenInstance}`;

  return pathParam === undefined ? url : `${url}/${pathParam}`;
};

/**
 * Every GREEN-API URL carries the instance id and token. Building it here, from the store,
 * keeps the credentials out of endpoint definitions and out of components.
 */
const baseQuery: BaseQueryFn<GreenApiRequest, unknown, FetchBaseQueryError> = async (
  { apiMethod, pathParam, instance, ...fetchArgs },
  api,
  extraOptions
) => {
  const credentials = instance ?? selectInstance(api.getState() as RootState);

  if (!credentials) {
    return { error: { status: 'CUSTOM_ERROR', error: 'Instance credentials are not set' } };
  }

  const result = await fetchQuery(
    { ...fetchArgs, url: buildUrl(credentials, apiMethod, pathParam) },
    api,
    extraOptions
  );

  // The stored token was revoked or regenerated, so the session cannot continue.
  if (result.error?.status === 401 && !instance) {
    api.dispatch(authActions.loggedOut({ sessionExpired: true }));
  }

  return result;
};

export const greenApi = createApi({
  reducerPath: 'greenApi',
  baseQuery,
  tagTypes: ['Settings'],
  // By default RTK Query refetches invalidated data only once no request is pending,
  // and here one almost always is: the long poll for notifications.
  invalidationBehavior: 'immediately',
  endpoints: () => ({}),
});
