import { useEffect } from 'react';

import { greenApiEndpoints } from '@/services/green-api/green-api.endpoints';
import { pollNotifications } from '@/services/green-api/poll-notifications';
import { chatActions } from '@/store/slices/chat.slice';

import { useAppDispatch } from './redux.hook';

const { receiveNotification, deleteNotification } = greenApiEndpoints.endpoints;

/** Keeps the chat in sync with the instance for as long as the component is mounted. */
export const useNotifications = (): void => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const controller = new AbortController();

    void pollNotifications({
      signal: controller.signal,
      receive: (signal) => {
        // `track: false`: an endless stream of requests has no place in the store.
        const request = dispatch(receiveNotification.initiate(undefined, { track: false }));
        const abort = () => request.abort();

        signal.addEventListener('abort', abort);

        return request.unwrap().finally(() => signal.removeEventListener('abort', abort));
      },
      acknowledge: (receiptId) =>
        dispatch(deleteNotification.initiate(receiptId, { track: false })).unwrap(),
      onNotification: (body) => dispatch(chatActions.notificationReceived(body)),
      onConnectionChange: (isOnline) => dispatch(chatActions.connectionChanged({ isOnline })),
    });

    return () => controller.abort();
  }, [dispatch]);
};
