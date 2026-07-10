import React from 'react';
import { Provider } from 'react-redux';
import { createAppStore } from '../store/index';
import type { PayflowApi } from '../services/api';

/** A real Redux store (no persistence concerns in these tests) wired to a mock API. */
export function createTestStore(api: Partial<PayflowApi> = {}) {
  const { store } = createAppStore('test-key', api as PayflowApi);
  return store;
}

export function storeWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}
