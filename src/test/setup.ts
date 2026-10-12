/// <reference types="vitest/jsdom" />
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Node 25 has a `localStorage` of its own. It shadows the one from jsdom and does not work
// without a backing file, so the tests are pointed back at the jsdom storages.
for (const name of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, name, { value: jsdom.window[name], configurable: true });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
