import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaymentResultView } from '../PaymentResultView';
import { createTestStore, storeWrapper, type PayflowApi } from '../../../test-utils/testStore';
import { selectProduct } from '../../../store/slices/cartSlice';
import { selectCheckoutStep, setCardField } from '../../../store/slices/checkoutSlice';
import {
  createTransaction,
  selectCurrentTransaction,
  selectTransactionHistory,
} from '../../../store/slices/transactionSlice';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

async function makeApprovedStore(status: 'APPROVED' | 'DECLINED' | 'ERROR' = 'APPROVED') {
  const api: Partial<PayflowApi> = {
    createTransaction: () =>
      Promise.resolve({
        transactionId: 'tx1',
        reference: 'ref-abc',
        amountInCents: 28900000,
        currency: 'COP',
      }),
  };
  const store = createTestStore(api);
  store.dispatch(selectProduct({ productId: 'p1', quantity: 1 }));
  await store.dispatch(
    createTransaction({
      productId: 'p1',
      quantity: 1,
      customerEmail: 'a@b.co',
      productName: 'Mechanical Keyboard TKL',
    }),
  );
  store.dispatch({
    type: 'transaction/pay/fulfilled',
    payload: { ...store.getState().transaction.current, status },
  });
  return store;
}

describe('PaymentResultView', () => {
  afterEach(() => {
    mockNavigate.mockClear();
  });

  it('renders nothing when there is no current transaction', async () => {
    const store = createTestStore();
    const { toJSON } = await render(<PaymentResultView />, { wrapper: storeWrapper(store) });
    expect(toJSON()).toBeNull();
  });

  it('shows success details for an APPROVED transaction', async () => {
    const store = await makeApprovedStore('APPROVED');
    const { getByText, queryByTestId } = await render(<PaymentResultView />, {
      wrapper: storeWrapper(store),
    });

    expect(getByText('Payment approved')).toBeTruthy();
    expect(getByText('ref-abc')).toBeTruthy();
    expect(getByText('COP 289,000.00')).toBeTruthy();
    expect(queryByTestId('try-again-button')).toBeNull();
  });

  it('renders the full receipt: product, total, card, date, reference and status', async () => {
    const store = await makeApprovedStore('APPROVED');
    store.dispatch(setCardField({ field: 'cardNumber', value: '4242424242424242' }));
    store.dispatch(setCardField({ field: 'installments', value: 3 }));

    const { getByText, getByTestId } = await render(<PaymentResultView />, {
      wrapper: storeWrapper(store),
    });

    expect(getByTestId('payment-receipt')).toBeTruthy();
    expect(getByText('Mechanical Keyboard TKL')).toBeTruthy();
    expect(getByText('COP 289,000.00')).toBeTruthy();
    expect(getByText('Visa •••• 4242 · 3 installments')).toBeTruthy();
    expect(getByText('Date')).toBeTruthy();
    expect(getByText('ref-abc')).toBeTruthy();
    expect(getByText('APPROVED')).toBeTruthy();
  });

  it('appends the quantity to the product row when buying more than one unit', async () => {
    const api: Partial<PayflowApi> = {
      createTransaction: () =>
        Promise.resolve({
          transactionId: 'tx1',
          reference: 'ref-abc',
          amountInCents: 57800000,
          currency: 'COP',
        }),
    };
    const store = createTestStore(api);
    await store.dispatch(
      createTransaction({
        productId: 'p1',
        quantity: 2,
        customerEmail: 'a@b.co',
        productName: 'Mechanical Keyboard TKL',
      }),
    );
    store.dispatch({
      type: 'transaction/pay/fulfilled',
      payload: { ...store.getState().transaction.current, status: 'APPROVED' },
    });

    const { getByText } = await render(<PaymentResultView />, {
      wrapper: storeWrapper(store),
    });

    expect(getByText('Mechanical Keyboard TKL × 2')).toBeTruthy();
  });

  it('omits the product and card rows when that data is unavailable (recovered session)', async () => {
    // Records persisted by earlier app versions have no productName, and the
    // in-memory card draft is empty after an app restart.
    const store = createTestStore();
    store.dispatch({
      type: 'transaction/pay/fulfilled',
      payload: {
        id: 'tx-old',
        reference: 'ref-old',
        status: 'APPROVED',
        amountInCents: 28900000,
        currency: 'COP',
        createdAt: '2026-07-10T00:00:00.000Z',
      },
    });

    const { getByText, queryByText } = await render(<PaymentResultView />, {
      wrapper: storeWrapper(store),
    });

    expect(getByText('ref-old')).toBeTruthy();
    expect(queryByText('Product')).toBeNull();
    expect(queryByText('Card')).toBeNull();
  });

  it('shows a decline message and a Try again button for DECLINED', async () => {
    const store = await makeApprovedStore('DECLINED');
    const { getByText, getByTestId } = await render(<PaymentResultView />, {
      wrapper: storeWrapper(store),
    });

    expect(getByText('Payment declined')).toBeTruthy();
    expect(getByText('Your card was declined. Please try a different card.')).toBeTruthy();
    expect(getByTestId('try-again-button')).toBeTruthy();
  });

  it('shows a provider-error message for ERROR', async () => {
    const store = await makeApprovedStore('ERROR');
    const { getByText } = await render(<PaymentResultView />, { wrapper: storeWrapper(store) });

    expect(getByText('The payment provider could not process this card.')).toBeTruthy();
  });

  it('Try again archives the transaction and reopens the card form', async () => {
    const store = await makeApprovedStore('DECLINED');
    const { getByTestId } = await render(<PaymentResultView />, { wrapper: storeWrapper(store) });

    fireEvent.press(getByTestId('try-again-button'));

    expect(selectCurrentTransaction(store.getState())).toBeNull();
    expect(selectTransactionHistory(store.getState())).toHaveLength(1);
    expect(selectCheckoutStep(store.getState())).toBe('card-info');
  });

  it('Back to Home archives, clears the cart, resets checkout and navigates Home', async () => {
    const store = await makeApprovedStore('APPROVED');
    const { getByTestId } = await render(<PaymentResultView />, { wrapper: storeWrapper(store) });

    fireEvent.press(getByTestId('back-to-home-button'));

    expect(selectCurrentTransaction(store.getState())).toBeNull();
    expect(selectTransactionHistory(store.getState())).toHaveLength(1);
    expect(store.getState().cart).toEqual({ productId: null, quantity: 0 });
    expect(selectCheckoutStep(store.getState())).toBe('idle');
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });
});
