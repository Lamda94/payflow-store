import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import { selectProductById } from './productsSlice';
import type { RootState } from '../rootReducer';

export interface CartState {
  productId: string | null;
  quantity: number;
}

const initialState: CartState = {
  productId: null,
  quantity: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    selectProduct: (
      state,
      action: PayloadAction<{ productId: string; quantity?: number }>,
    ) => {
      state.productId = action.payload.productId;
      state.quantity = Math.max(1, action.payload.quantity ?? 1);
    },
    setQuantity: (state, action: PayloadAction<number>) => {
      state.quantity = Math.max(1, action.payload);
    },
    clearCart: () => initialState,
  },
});

export const { selectProduct, setQuantity, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;

export const selectCart = (state: RootState): CartState => state.cart;

export const selectCartProduct = createSelector(
  [selectCart, (state: RootState) => state],
  (cart, state) =>
    cart.productId ? selectProductById(cart.productId)(state) : undefined,
);

export const selectCartTotalInCents = createSelector(
  [selectCart, selectCartProduct],
  (cart, product) => (product ? product.priceInCents * cart.quantity : 0),
);
