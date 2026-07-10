import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../domain/types';
import type { PayflowApi } from '../../services/api';
import type { RootState } from '../rootReducer';

export type NetworkStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ProductsState {
  items: Product[];
  status: NetworkStatus;
  error?: string;
}

const initialState: ProductsState = {
  items: [],
  status: 'idle',
};

export const fetchProducts = createAsyncThunk<
  Product[],
  void,
  { extra: PayflowApi }
>('products/fetchProducts', (_arg, { extra }) => extra.listProducts());

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchProducts.pending, state => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(
        fetchProducts.fulfilled,
        (state, action: PayloadAction<Product[]>) => {
          state.status = 'succeeded';
          state.items = action.payload;
        },
      )
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load products';
      });
  },
});

export const productsReducer = productsSlice.reducer;

export const selectProducts = (state: RootState): Product[] =>
  state.products.items;
export const selectProductsStatus = (state: RootState): NetworkStatus =>
  state.products.status;
export const selectProductsError = (state: RootState): string | undefined =>
  state.products.error;
export const selectProductById =
  (productId: string) =>
  (state: RootState): Product | undefined =>
    state.products.items.find(p => p.id === productId);
