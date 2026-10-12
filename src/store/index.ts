import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { greenApi } from '@/services/green-api/green-api.service';

import { authListener } from './auth.listener';
import { authReducer } from './slices/auth.slice';
import { chatReducer } from './slices/chat.slice';

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  [greenApi.reducerPath]: greenApi.reducer,
});

export const setupStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(authListener.middleware).concat(greenApi.middleware),
  });

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
