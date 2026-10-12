import type { NotificationBody, ReceiveNotificationResponse } from '@/types';

export interface PollNotificationsOptions {
  /** Long-polls the queue; resolves with `null` when nothing arrived in time. */
  receive: (signal: AbortSignal) => Promise<ReceiveNotificationResponse>;
  /** Removes a handled notification from the queue. */
  acknowledge: (receiptId: number) => Promise<unknown>;
  onNotification: (body: NotificationBody) => void;
  onConnectionChange?: (isOnline: boolean) => void;
  /** Stops the loop. */
  signal: AbortSignal;
}

const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

/** Resolves after `ms`, or at once if the loop is stopped in the meantime. */
const wait = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);

    signal.addEventListener('abort', finish);
  });

/**
 * Reads the GREEN-API notification queue until `signal` is aborted.
 *
 * The queue hands out the same notification until it is deleted, so each one is handled
 * first and deleted second: a failure in between leads to a repeat, never to a lost message.
 * That makes `onNotification` responsible for being idempotent.
 */
export const pollNotifications = async ({
  receive,
  acknowledge,
  onNotification,
  onConnectionChange,
  signal,
}: PollNotificationsOptions): Promise<void> => {
  let failures = 0;

  while (!signal.aborted) {
    try {
      const notification = await receive(signal);

      if (signal.aborted) {
        return;
      }
      if (failures > 0) {
        failures = 0;
        onConnectionChange?.(true);
      }
      if (!notification) {
        continue;
      }

      try {
        onNotification(notification.body);
      } catch (error) {
        // A notification the app cannot handle must still be deleted, or it would block the queue.
        console.error('Failed to handle a notification', error);
      }

      await acknowledge(notification.receiptId);
    } catch {
      if (signal.aborted) {
        return;
      }

      failures += 1;
      if (failures === 1) {
        onConnectionChange?.(false);
      }

      await wait(RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length) - 1], signal);
    }
  }
};
