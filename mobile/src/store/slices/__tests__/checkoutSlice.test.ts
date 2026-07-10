import {
  checkoutReducer,
  goToProcessing,
  goToResult,
  goToSummary,
  openCheckout,
  resetCheckout,
  selectCardDraft,
  selectCheckout,
  selectCheckoutStep,
  setCardField,
  setCustomerEmail,
} from '../checkoutSlice';
import { rootReducer } from '../../rootReducer';

describe('checkoutSlice', () => {
  it('starts idle with an empty card draft', () => {
    const state = checkoutReducer(undefined, { type: '@@init' });
    expect(state.step).toBe('idle');
    expect(state.card).toEqual({
      cardNumber: '',
      holderName: '',
      expirationMonth: '',
      expirationYear: '',
      cvc: '',
      installments: 1,
    });
  });

  it('walks through the step machine', () => {
    let state = checkoutReducer(undefined, openCheckout());
    expect(state.step).toBe('card-info');

    state = checkoutReducer(state, goToSummary());
    expect(state.step).toBe('summary');

    state = checkoutReducer(state, goToProcessing());
    expect(state.step).toBe('processing');

    state = checkoutReducer(state, goToResult());
    expect(state.step).toBe('result');
  });

  it('setCardField updates a single field without touching the rest', () => {
    let state = checkoutReducer(
      undefined,
      setCardField({ field: 'cardNumber', value: '4242424242424242' }),
    );
    state = checkoutReducer(
      state,
      setCardField({ field: 'installments', value: 6 }),
    );

    expect(state.card.cardNumber).toBe('4242424242424242');
    expect(state.card.installments).toBe(6);
    expect(state.card.cvc).toBe('');
  });

  it('setCustomerEmail updates the email', () => {
    const state = checkoutReducer(
      undefined,
      setCustomerEmail('buyer@example.com'),
    );
    expect(state.customerEmail).toBe('buyer@example.com');
  });

  it('resetCheckout wipes card data back to initial state', () => {
    let state = checkoutReducer(
      undefined,
      setCardField({ field: 'cardNumber', value: '4242424242424242' }),
    );
    state = checkoutReducer(state, resetCheckout());

    expect(state.card.cardNumber).toBe('');
    expect(state.step).toBe('idle');
  });

  it('selectors read checkout, its step and its card draft', () => {
    const checkout = checkoutReducer(
      undefined,
      setCardField({ field: 'cvc', value: '123' }),
    );
    const state = { ...rootReducer(undefined, { type: '@@init' }), checkout };

    expect(selectCheckout(state)).toBe(checkout);
    expect(selectCheckoutStep(state)).toBe('idle');
    expect(selectCardDraft(state).cvc).toBe('123');
  });
});
