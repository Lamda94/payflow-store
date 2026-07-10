import { configureStore } from '@reduxjs/toolkit';
import {
  fetchProducts,
  productsReducer,
  selectProductById,
  selectProducts,
  selectProductsError,
  selectProductsStatus,
} from '../productsSlice';
import type { Product } from '../../../domain/types';
import type { PayflowApi } from '../../../services/api';
import { rootReducer } from '../../rootReducer';

const product: Product = {
  id: 'p1',
  name: 'Keyboard',
  description: 'desc',
  imageUrl: 'https://example.com/a.jpg',
  priceInCents: 1000,
  currency: 'COP',
  stock: 5,
};

function makeStore(api: Partial<PayflowApi>) {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: { extraArgument: api as PayflowApi } }),
  });
}

describe('productsSlice', () => {
  it('starts idle with no items', () => {
    const state = productsReducer(undefined, { type: '@@init' });
    expect(state.status).toBe('idle');
    expect(state.items).toEqual([]);
  });

  it('fetchProducts: pending -> loading, fulfilled -> succeeded with items', async () => {
    const store = makeStore({ listProducts: () => Promise.resolve([product]) });

    const promise = store.dispatch(fetchProducts());
    expect(selectProductsStatus(store.getState())).toBe('loading');

    await promise;
    expect(selectProductsStatus(store.getState())).toBe('succeeded');
    expect(selectProducts(store.getState())).toEqual([product]);
    expect(selectProductById('p1')(store.getState())).toEqual(product);
    expect(selectProductById('missing')(store.getState())).toBeUndefined();
  });

  it('fetchProducts: rejected -> failed with error message', async () => {
    const store = makeStore({
      listProducts: () => Promise.reject(new Error('network down')),
    });

    await store.dispatch(fetchProducts());

    expect(selectProductsStatus(store.getState())).toBe('failed');
    expect(selectProductsError(store.getState())).toBe('network down');
  });

  it('falls back to a default error message when the thunk error has none', () => {
    const state = productsReducer(undefined, {
      type: fetchProducts.rejected.type,
      error: {},
    });
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Failed to load products');
  });
});
