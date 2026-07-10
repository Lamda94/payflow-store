import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import { rootReducer, type RootState } from './rootReducer';
import { createEncryptedTransform } from './persist/encryptedTransform';
import { getOrCreatePersistenceKey } from './persist/keychain';
import { notImplementedApi, type PayflowApi } from '../services/api';
import { fetchTransactionStatus } from './slices/transactionSlice';

export function createAppStore(
  secretKey: string,
  api: PayflowApi = notImplementedApi,
) {
  const persistedReducer = persistReducer<RootState>(
    {
      key: 'root',
      storage: AsyncStorage,
      whitelist: ['cart', 'transaction'],
      transforms: [createEncryptedTransform(secretKey)],
    },
    rootReducer,
  );

  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
        thunk: { extraArgument: api },
      }),
  });

  const persistor = persistStore(store, undefined, () => {
    const current = store.getState().transaction.current;
    if (current && current.status === 'PENDING') {
      store.dispatch(fetchTransactionStatus(current.id));
    }
  });

  return { store, persistor };
}

export type AppStore = ReturnType<typeof createAppStore>['store'];
export type AppDispatch = AppStore['dispatch'];

/** Resolves the encryption key from the Keystore/Keychain, then boots the store. */
export async function initStore(api?: PayflowApi) {
  const secretKey = await getOrCreatePersistenceKey();
  return createAppStore(secretKey, api);
}
