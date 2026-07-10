import { combineReducers } from '@reduxjs/toolkit';
import { productsReducer } from './slices/productsSlice';
import { cartReducer } from './slices/cartSlice';
import { checkoutReducer } from './slices/checkoutSlice';
import { transactionReducer } from './slices/transactionSlice';

export const rootReducer = combineReducers({
  products: productsReducer,
  cart: cartReducer,
  checkout: checkoutReducer,
  transaction: transactionReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
