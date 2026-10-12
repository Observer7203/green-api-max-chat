import { createListenerMiddleware } from '@reduxjs/toolkit';

import { greenApi } from '@/services/green-api/green-api.service';

import { authActions } from './slices/auth.slice';
import { clearInstance, saveInstance } from './storage';

/** Side effects of login and logout, kept out of the reducers. */
export const authListener = createListenerMiddleware();

authListener.startListening({
  actionCreator: authActions.loggedIn,
  effect: ({ payload }) => {
    saveInstance(payload.instance, payload.remember);
  },
});

authListener.startListening({
  actionCreator: authActions.loggedOut,
  effect: (_action, { dispatch }) => {
    clearInstance();
    // Cache keys do not include the instance, so nothing cached may outlive the session.
    dispatch(greenApi.util.resetApiState());
  },
});
