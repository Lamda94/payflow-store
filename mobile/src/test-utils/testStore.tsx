import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { rootReducer } from '../store/rootReducer';
import { notImplementedApi, type PayflowApi } from '../services/api';

// Re-exported so ui/**/__tests__ files can type their mocks without
// importing services/** directly, which the R15.2 lint override forbids.
export type { PayflowApi };

/**
 * A plain (non-persisted) Redux store wired to a mock API — component/screen
 * tests only care about state behavior, not persistence (that's covered by
 * store/persist and store/index specs). Using createAppStore here would wire
 * real redux-persist against the shared mocked AsyncStorage, letting one
 * test's state rehydrate into the next test's "fresh" store.
 */
export function createTestStore(api: Partial<PayflowApi> = {}) {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: { extraArgument: { ...notImplementedApi, ...api } as PayflowApi },
      }),
  });
}

export function storeWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}
