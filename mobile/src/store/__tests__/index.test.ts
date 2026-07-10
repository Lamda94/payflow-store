import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAppStore } from '../index';
import { selectProduct } from '../slices/cartSlice';
import { setCardField } from '../slices/checkoutSlice';
import { createTransaction } from '../slices/transactionSlice';
import type { PayflowApi } from '../../services/api';

const KEY = 'integration-test-key';

function waitForBootstrap(persistor: ReturnType<typeof createAppStore>['persistor']) {
  return new Promise<void>(resolve => {
    if (persistor.getState().bootstrapped) {
      resolve();
      return;
    }
    const unsubscribe = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        unsubscribe();
        resolve();
      }
    });
  });
}

describe('createAppStore persistence', () => {
  let activePersistors: Array<ReturnType<typeof createAppStore>['persistor']> = [];

  function track(app: ReturnType<typeof createAppStore>) {
    activePersistors.push(app.persistor);
    return app;
  }

  afterEach(async () => {
    activePersistors.forEach(persistor => persistor.pause());
    activePersistors = [];
    await AsyncStorage.clear();
  });

  it('persists whitelisted slices (cart, transaction) across store instances', async () => {
    const api: PayflowApi = {
      listProducts: () => Promise.resolve([]),
      createTransaction: () =>
        Promise.resolve({
          transactionId: 'tx1',
          reference: 'ref1',
          amountInCents: 5000,
          currency: 'COP',
        }),
      payTransaction: () =>
        Promise.resolve({ status: 'APPROVED', transactionId: 'tx1' }),
      getTransactionStatus: () =>
        Promise.resolve({
          id: 'tx1',
          status: 'APPROVED',
          amountInCents: 5000,
          currency: 'COP',
          createdAt: '2026-07-10T00:00:00.000Z',
        }),
    };

    const first = track(createAppStore(KEY, api));
    await waitForBootstrap(first.persistor);

    first.store.dispatch(selectProduct({ productId: 'p1', quantity: 2 }));
    await first.store.dispatch(
      createTransaction({ productId: 'p1', quantity: 2, customerEmail: 'a@b.co' }),
    );
    await first.persistor.flush();

    const second = track(createAppStore(KEY, api));
    await waitForBootstrap(second.persistor);

    expect(second.store.getState().cart).toEqual({
      productId: 'p1',
      quantity: 2,
    });
    expect(second.store.getState().transaction.current?.id).toBe('tx1');
  });

  it('never persists checkout (card data blacklisted)', async () => {
    const api: PayflowApi = {
      listProducts: () => Promise.resolve([]),
      createTransaction: () =>
        Promise.reject(new Error('unused')),
      payTransaction: () => Promise.reject(new Error('unused')),
      getTransactionStatus: () => Promise.reject(new Error('unused')),
    };

    const first = track(createAppStore(`${KEY}-blacklist`, api));
    await waitForBootstrap(first.persistor);

    first.store.dispatch(
      setCardField({ field: 'cardNumber', value: '4242424242424242' }),
    );
    await first.persistor.flush();

    const second = track(createAppStore(`${KEY}-blacklist`, api));
    await waitForBootstrap(second.persistor);

    expect(second.store.getState().checkout.card.cardNumber).toBe('');
  });
});
