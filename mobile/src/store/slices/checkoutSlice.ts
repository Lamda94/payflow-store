import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../rootReducer';

export type CheckoutStep =
  | 'idle'
  | 'card-info'
  | 'summary'
  | 'processing'
  | 'result';

export interface CardDraft {
  cardNumber: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvc: string;
  installments: number;
}

export interface CheckoutState {
  step: CheckoutStep;
  customerEmail: string;
  card: CardDraft;
}

const initialCardDraft: CardDraft = {
  cardNumber: '',
  holderName: '',
  expirationMonth: '',
  expirationYear: '',
  cvc: '',
  installments: 1,
};

const initialState: CheckoutState = {
  step: 'idle',
  customerEmail: '',
  card: initialCardDraft,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    openCheckout: state => {
      state.step = 'card-info';
    },
    setCustomerEmail: (state, action: PayloadAction<string>) => {
      state.customerEmail = action.payload;
    },
    setCardField: (
      state,
      action: PayloadAction<{ field: keyof CardDraft; value: string | number }>,
    ) => {
      (state.card[action.payload.field] as string | number) =
        action.payload.value;
    },
    goToSummary: state => {
      state.step = 'summary';
    },
    goToProcessing: state => {
      state.step = 'processing';
    },
    goToResult: state => {
      state.step = 'result';
    },
    resetCheckout: () => initialState,
  },
});

export const {
  openCheckout,
  setCustomerEmail,
  setCardField,
  goToSummary,
  goToProcessing,
  goToResult,
  resetCheckout,
} = checkoutSlice.actions;
export const checkoutReducer = checkoutSlice.reducer;

export const selectCheckout = (state: RootState): CheckoutState =>
  state.checkout;
export const selectCheckoutStep = (state: RootState): CheckoutStep =>
  state.checkout.step;
export const selectCardDraft = (state: RootState): CardDraft =>
  state.checkout.card;
