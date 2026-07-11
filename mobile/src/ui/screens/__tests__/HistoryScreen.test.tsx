import React from 'react';
import { render } from '@testing-library/react-native';
import { HistoryScreen } from '../HistoryScreen';
import { createTestStore, storeWrapper } from '../../../test-utils/testStore';
import type { TransactionRecord } from '../../../domain/types';

function archive(store: ReturnType<typeof createTestStore>, record: TransactionRecord) {
  store.dispatch({ type: 'transaction/pay/fulfilled', payload: record });
  store.dispatch({ type: 'transaction/archiveCurrentTransaction' });
}

describe('HistoryScreen', () => {
  it('shows an empty state when there are no archived purchases', async () => {
    const store = createTestStore();

    const { getByTestId, getByText } = await render(<HistoryScreen />, {
      wrapper: storeWrapper(store),
    });

    expect(getByTestId('history-empty')).toBeTruthy();
    expect(getByText('No purchases yet')).toBeTruthy();
  });

  it('lists archived purchases with product, quantity, amount, date and status', async () => {
    const store = createTestStore();
    archive(store, {
      id: 'tx1',
      reference: 'ref-1',
      status: 'APPROVED',
      amountInCents: 57800000,
      currency: 'COP',
      createdAt: '2026-07-11T10:00:00.000Z',
      productName: 'Mechanical Keyboard TKL',
      quantity: 2,
    });
    archive(store, {
      id: 'tx2',
      reference: 'ref-2',
      status: 'DECLINED',
      amountInCents: 39900000,
      currency: 'COP',
      createdAt: '2026-07-11T11:00:00.000Z',
      productName: 'Portable SSD 1TB',
      quantity: 1,
    });

    const { getAllByTestId, getByText } = await render(<HistoryScreen />, {
      wrapper: storeWrapper(store),
    });

    expect(getAllByTestId('history-item')).toHaveLength(2);
    expect(getByText('Mechanical Keyboard TKL × 2')).toBeTruthy();
    expect(getByText('Portable SSD 1TB')).toBeTruthy();
    expect(getByText('COP 578,000.00')).toBeTruthy();
    expect(getByText('APPROVED')).toBeTruthy();
    expect(getByText('DECLINED')).toBeTruthy();
  });

  it('falls back to the reference for records without product metadata', async () => {
    // Records persisted by earlier app versions have no productName.
    const store = createTestStore();
    archive(store, {
      id: 'tx-old',
      reference: 'ref-old',
      status: 'APPROVED',
      amountInCents: 28900000,
      currency: 'COP',
      createdAt: '2026-07-10T00:00:00.000Z',
    });

    const { getByText } = await render(<HistoryScreen />, {
      wrapper: storeWrapper(store),
    });

    expect(getByText('Ref. ref-old')).toBeTruthy();
  });
});
