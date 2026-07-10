import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { createAppStore, initStore } from './index';
import { httpApi } from '../services/httpApi';

interface Props {
  children: React.ReactNode;
}

/**
 * Boots the Redux store: resolves the AES key from the Keystore/Keychain,
 * then mounts children behind Provider + PersistGate. Nothing app-specific
 * renders until the encrypted state has had a chance to rehydrate.
 */
export function StoreProvider({ children }: Props) {
  const [app, setApp] = useState<ReturnType<typeof createAppStore> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    initStore(httpApi).then(created => {
      if (!cancelled) {
        setApp(created);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!app) {
    return (
      <View style={styles.loading} testID="store-provider-loading">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Provider store={app.store}>
      <PersistGate loading={null} persistor={app.persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
