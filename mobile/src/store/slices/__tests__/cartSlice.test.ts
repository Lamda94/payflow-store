import { configureStore } from '@reduxjs/toolkit';
import {
  cartReducer,
  clearCart,
  selectCartProduct,
  selectCartTotalInCents,
  selectProduct,
  setQuantity,
} from '../cartSlice';
import { fetchProducts } from '../productsSlice';
import { rootReducer } from '../../rootReducer';
import type { Product } from '../../../domain/types';
import type { PayflowApi } from '../../../services/api';

const product: Product = {
  id: 'p1',
  name: 'Keyboard',
  description: 'desc',
  imageUrl: 'https://example.com/a.jpg',
  priceInCents: 1000,
  currency: 'COP',
  stock: 5,
};

function makeStoreWithProduct() {
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            listProducts: () => Promise.resolve([product]),
          } as PayflowApi,
        },
      }),
  });
  return store;
}

describe('cartSlice', () => {
  it('starts empty', () => {
    const state = cartReducer(undefined, { type: '@@init' });
    expect(state).toEqual({ productId: null, quantity: 0 });
  });

  it('selectProduct sets productId and defaults quantity to 1', () => {
    const state = cartReducer(undefined, selectProduct({ productId: 'p1' }));
    expect(state).toEqual({ productId: 'p1', quantity: 1 });
  });

  it('selectProduct clamps a non-positive quantity to 1', () => {
    const state = cartReducer(
      undefined,
      selectProduct({ productId: 'p1', quantity: 0 }),
    );
    expect(state.quantity).toBe(1);
  });

  it('setQuantity clamps to a minimum of 1', () => {
    const withProduct = cartReducer(undefined, selectProduct({ productId: 'p1', quantity: 3 }));
    const state = cartReducer(withProduct, setQuantity(-5));
    expect(state.quantity).toBe(1);
  });

  it('clearCart resets to initial state', () => {
    const withProduct = cartReducer(undefined, selectProduct({ productId: 'p1', quantity: 3 }));
    expect(cartReducer(withProduct, clearCart())).toEqual({
      productId: null,
      quantity: 0,
    });
  });

  it('selectCartProduct and selectCartTotalInCents derive from products + cart', async () => {
    const store = makeStoreWithProduct();
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct({ productId: 'p1', quantity: 3 }));

    expect(selectCartProduct(store.getState())).toEqual(product);
    expect(selectCartTotalInCents(store.getState())).toBe(3000);
  });

  it('selectCartTotalInCents is 0 when no product is selected', () => {
    const store = makeStoreWithProduct();
    expect(selectCartTotalInCents(store.getState())).toBe(0);
  });
});
