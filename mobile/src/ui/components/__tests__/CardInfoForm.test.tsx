import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CardInfoForm } from '../CardInfoForm';
import { createTestStore, storeWrapper } from '../../../test-utils/testStore';
import { selectCardDraft, selectCheckoutStep } from '../../../store/slices/checkoutSlice';

async function fillValidCard(getByTestId: (id: string) => any) {
  fireEvent.changeText(getByTestId('card-number-input'), '4242424242424242');
  await waitFor(() =>
    expect(getByTestId('card-number-input').props.value).toBe('4242 4242 4242 4242'),
  );
  fireEvent.changeText(getByTestId('holder-name-input'), 'JOHN DOE');
  await waitFor(() => expect(getByTestId('holder-name-input').props.value).toBe('JOHN DOE'));
  fireEvent.changeText(getByTestId('expiration-input'), '1230');
  await waitFor(() => expect(getByTestId('expiration-input').props.value).toBe('12/30'));
  fireEvent.changeText(getByTestId('cvc-input'), '123');
  await waitFor(() => expect(getByTestId('cvc-input').props.value).toBe('123'));
  fireEvent.changeText(getByTestId('email-input'), 'buyer@example.com');
  await waitFor(() =>
    expect(getByTestId('email-input').props.value).toBe('buyer@example.com'),
  );
}

describe('CardInfoForm', () => {
  it('disables Continue until every field is valid', async () => {
    const store = createTestStore();
    const { getByTestId } = await render(<CardInfoForm />, { wrapper: storeWrapper(store) });

    expect(getByTestId('continue-button').props.accessibilityState.disabled).toBe(true);
  });

  it('formats the card number with spaces and shows the VISA logo once detected', async () => {
    const store = createTestStore();
    const { getByTestId } = await render(<CardInfoForm />, { wrapper: storeWrapper(store) });

    fireEvent.changeText(getByTestId('card-number-input'), '4242424242424242');

    await waitFor(() => {
      expect(getByTestId('card-number-input').props.value).toBe('4242 4242 4242 4242');
    });
    expect(getByTestId('brand-logo-visa')).toBeTruthy();
  });

  it('stores raw digits (not the formatted display) in the checkout draft', async () => {
    const store = createTestStore();
    const { getByTestId } = await render(<CardInfoForm />, { wrapper: storeWrapper(store) });

    fireEvent.changeText(getByTestId('card-number-input'), '4242 4242 4242 4242');

    await waitFor(() => {
      expect(selectCardDraft(store.getState()).cardNumber).toBe('4242424242424242');
    });
  });

  it('splits the MM/YY expiration input into a 2-digit month and 4-digit year', async () => {
    const store = createTestStore();
    const { getByTestId } = await render(<CardInfoForm />, { wrapper: storeWrapper(store) });

    fireEvent.changeText(getByTestId('expiration-input'), '1230');

    await waitFor(() => {
      const card = selectCardDraft(store.getState());
      expect(card.expirationMonth).toBe('12');
      expect(card.expirationYear).toBe('2030');
    });
    expect(getByTestId('expiration-input').props.value).toBe('12/30');
  });

  it('shows a field-level error for an invalid email, only once something was typed', async () => {
    const store = createTestStore();
    const { getByTestId, queryByTestId } = await render(<CardInfoForm />, {
      wrapper: storeWrapper(store),
    });

    expect(queryByTestId('email-input-error')).toBeNull();

    fireEvent.changeText(getByTestId('email-input'), 'not-an-email');

    await waitFor(() => {
      expect(getByTestId('email-input-error')).toBeTruthy();
    });
  });

  it('enables Continue once every field is valid and advances to the summary step', async () => {
    const store = createTestStore();
    const { getByTestId } = await render(<CardInfoForm />, { wrapper: storeWrapper(store) });

    await fillValidCard(getByTestId);

    await waitFor(() => {
      expect(getByTestId('continue-button').props.accessibilityState.disabled).toBe(false);
    });

    fireEvent.press(getByTestId('continue-button'));

    expect(selectCheckoutStep(store.getState())).toBe('summary');
  });

  it('clamps installments between 1 and 36 via the stepper', async () => {
    const store = createTestStore();
    const { getByTestId } = await render(<CardInfoForm />, { wrapper: storeWrapper(store) });

    fireEvent.press(getByTestId('quantity-decrement'));

    await waitFor(() => {
      expect(selectCardDraft(store.getState()).installments).toBe(1);
    });
  });

  it('increments installments via the stepper', async () => {
    const store = createTestStore();
    const { getByTestId } = await render(<CardInfoForm />, { wrapper: storeWrapper(store) });

    fireEvent.press(getByTestId('quantity-increment'));

    await waitFor(() => {
      expect(selectCardDraft(store.getState()).installments).toBe(2);
    });
  });
});
