import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Notification } from '@/types';

import { pollNotifications, type PollNotificationsOptions } from './poll-notifications';

const createNotification = (receiptId: number): Notification => ({
  receiptId,
  body: { typeWebhook: 'incomingCall', timestamp: receiptId },
});

/** Runs the loop over a scripted queue and stops it once the script is exhausted. */
const runLoop = (
  responses: (Notification | null | Error)[],
  overrides: Partial<PollNotificationsOptions> = {}
) => {
  const controller = new AbortController();
  const steps = [...responses];
  const mocks = {
    receive: vi.fn(async () => {
      const step = steps.shift();

      if (step === undefined) {
        controller.abort();
        return null;
      }
      if (step instanceof Error) {
        throw step;
      }
      return step;
    }),
    acknowledge: vi.fn(async () => ({ result: true })),
    onNotification: vi.fn(),
    onConnectionChange: vi.fn(),
  };
  const finished = pollNotifications({ signal: controller.signal, ...mocks, ...overrides });

  return { ...mocks, controller, finished };
};

describe('pollNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles a notification and only then deletes it from the queue', async () => {
    const calls: string[] = [];
    const loop = runLoop([createNotification(7)], {
      onNotification: vi.fn(() => calls.push('handle')),
      acknowledge: vi.fn(async (receiptId: number) => calls.push(`delete ${receiptId}`)),
    });

    await loop.finished;

    expect(calls).toEqual(['handle', 'delete 7']);
  });

  it('keeps polling while the queue is empty', async () => {
    const loop = runLoop([null, null, createNotification(1)]);

    await loop.finished;

    expect(loop.receive).toHaveBeenCalledTimes(4);
    expect(loop.onNotification).toHaveBeenCalledTimes(1);
  });

  it('retries after a failure and reports the connection going down and coming back', async () => {
    const loop = runLoop([new Error('offline'), new Error('offline'), createNotification(1)]);

    await vi.runAllTimersAsync();
    await loop.finished;

    expect(loop.onConnectionChange.mock.calls).toEqual([[false], [true]]);
    expect(loop.onNotification).toHaveBeenCalledTimes(1);
  });

  it('waits longer before each next retry', async () => {
    const loop = runLoop([new Error('offline'), new Error('offline')]);

    await vi.advanceTimersByTimeAsync(999);
    expect(loop.receive).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(loop.receive).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1_999);
    expect(loop.receive).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(loop.receive).toHaveBeenCalledTimes(3);

    await loop.finished;
  });

  it('deletes a notification even if handling it throws, so that it cannot block the queue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const loop = runLoop([createNotification(3)], {
      onNotification: vi.fn(() => {
        throw new Error('Unexpected notification');
      }),
    });

    await loop.finished;

    expect(loop.acknowledge).toHaveBeenCalledWith(3);
    expect(loop.onConnectionChange).not.toHaveBeenCalled();
  });

  it('stops without handling the notification that arrives after the abort', async () => {
    const controller = new AbortController();
    const onNotification = vi.fn();
    const acknowledge = vi.fn();

    await pollNotifications({
      signal: controller.signal,
      receive: async () => {
        controller.abort();
        return createNotification(1);
      },
      acknowledge,
      onNotification,
    });

    expect(onNotification).not.toHaveBeenCalled();
    expect(acknowledge).not.toHaveBeenCalled();
  });

  it('stops at once when aborted while waiting to retry', async () => {
    const loop = runLoop([new Error('offline'), null, null]);

    await vi.advanceTimersByTimeAsync(0);
    loop.controller.abort();
    await loop.finished;

    expect(loop.receive).toHaveBeenCalledTimes(1);
  });
});
