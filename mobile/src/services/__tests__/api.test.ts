import { notImplementedApi } from '../api';

describe('notImplementedApi', () => {
  it('rejects every method until the real HTTP client lands in M5', async () => {
    await expect(notImplementedApi.listProducts()).rejects.toThrow(
      'not implemented',
    );
    await expect(
      notImplementedApi.createTransaction({
        productId: 'p1',
        quantity: 1,
        customerEmail: 'a@b.co',
      }),
    ).rejects.toThrow('not implemented');
    await expect(
      notImplementedApi.payTransaction('tx1', {
        cardNumber: '4242424242424242',
        holderName: 'Test',
        expirationMonth: '12',
        expirationYear: '2030',
        cvc: '123',
        installments: 1,
      }),
    ).rejects.toThrow('not implemented');
    await expect(
      notImplementedApi.getTransactionStatus('tx1'),
    ).rejects.toThrow('not implemented');
  });
});
