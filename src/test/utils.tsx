import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { vi } from 'vitest';

import { setupStore, type RootState } from '@/store';
import type { Instance } from '@/types';

export const TEST_INSTANCE: Instance = {
  idInstance: '1101000001',
  apiTokenInstance: 'test-token',
};

/** A store that is already logged in, unless the test says otherwise. */
export const createTestStore = (preloadedState?: Partial<RootState>) =>
  setupStore({ auth: { instance: TEST_INSTANCE, sessionExpired: false }, ...preloadedState });

export const renderWithStore = (ui: ReactElement, store = createTestStore()) => ({
  store,
  ...render(<Provider store={store}>{ui}</Provider>),
});

type Handler = (body: unknown, request: Request) => unknown;

const toResponse = (result: unknown): Response =>
  result instanceof Response ? result : Response.json(result);

/**
 * Replaces `fetch` with handlers keyed by GREEN-API method name. A handler returns the JSON
 * to answer with, or a `Response` for anything other than a plain 200.
 */
export const stubGreenApi = (handlers: Record<string, Handler>) => {
  const fetchMock = vi.fn(async (request: Request): Promise<Response> => {
    const [, apiMethod] = new URL(request.url).pathname.match(/^\/waInstance\d+\/(\w+)\//) ?? [];
    const handler = handlers[apiMethod];

    if (!handler) {
      return Response.json({ message: `Unexpected request: ${apiMethod}` }, { status: 404 });
    }

    // Read from a copy, so that a test can still look at what was sent.
    const body: unknown = request.method === 'POST' ? await request.clone().json() : undefined;

    return toResponse(await handler(body, request));
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

/** A promise settled from the outside — to look at the state while a request is in flight. */
export const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};
