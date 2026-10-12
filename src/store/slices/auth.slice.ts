import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { loadInstance } from '@/store/storage';
import type { Instance } from '@/types';

export interface AuthState {
  instance: Instance | null;
  /** The previous session was ended because GREEN-API rejected the stored token. */
  sessionExpired: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: (): AuthState => ({ instance: loadInstance(), sessionExpired: false }),
  reducers: {
    loggedIn: (state, action: PayloadAction<{ instance: Instance; remember: boolean }>) => {
      state.instance = action.payload.instance;
      state.sessionExpired = false;
    },
    loggedOut: (state, action: PayloadAction<{ sessionExpired: boolean } | undefined>) => {
      state.instance = null;
      state.sessionExpired = action.payload?.sessionExpired ?? false;
    },
  },
  selectors: {
    selectInstance: (state) => state.instance,
    selectSessionExpired: (state) => state.sessionExpired,
  },
});

export const authReducer = authSlice.reducer;
export const authActions = authSlice.actions;
export const { selectInstance, selectSessionExpired } = authSlice.selectors;
