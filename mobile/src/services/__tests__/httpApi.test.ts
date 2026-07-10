import { httpApi } from '../httpApi';
import { API_BASE_URL } from '../config';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('httpApi', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('listProducts GETs /products', async () => {
    const products = [{ id: 'p1', name: 'Keyboard', description: '', imageUrl: '', priceInCents: 1000, currency: 'COP', stock: 5 }];
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(products));

    const result = await httpApi.listProducts();

    expect(result).toEqual(products);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/products`,
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );
  });

  it('createTransaction POSTs to /transactions with the input as body', async () => {
    const responseBody = { transactionId: 'tx1', reference: 'ref1', amountInCents: 1000, currency: 'COP' };
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(responseBody));

    const input = { productId: 'p1', quantity: 1, customerEmail: 'a@b.co' };
    const result = await httpApi.createTransaction(input);

    expect(result).toEqual(responseBody);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/transactions`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    );
  });

  it('payTransaction POSTs to /transactions/:id/pay', async () => {
    const responseBody = { status: 'APPROVED', transactionId: 'tx1', pspTransactionId: 'psp1' };
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(responseBody));

    const card = {
      cardNumber: '4242424242424242',
      holderName: 'Test',
      expirationMonth: '12',
      expirationYear: '2030',
      cvc: '123',
      installments: 1,
    };
    const result = await httpApi.payTransaction('tx1', card);

    expect(result).toEqual(responseBody);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/transactions/tx1/pay`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(card) }),
    );
  });

  it('getTransactionStatus GETs /transactions/:id', async () => {
    const responseBody = { id: 'tx1', status: 'APPROVED', amountInCents: 1000, currency: 'COP', createdAt: '2026-07-10T00:00:00.000Z' };
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(responseBody));

    const result = await httpApi.getTransactionStatus('tx1');

    expect(result).toEqual(responseBody);
    expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/transactions/tx1`, expect.anything());
  });

  it('throws the backend error message on a non-ok response', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ code: 'INSUFFICIENT_STOCK', message: 'Insufficient stock: requested 9, available 5' }, false, 422),
    );

    await expect(httpApi.listProducts()).rejects.toThrow('Insufficient stock: requested 9, available 5');
  });

  it('falls back to the error code when the backend omits a message', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse({ code: 'NOT_FOUND' }, false, 404));

    await expect(httpApi.listProducts()).rejects.toThrow('NOT_FOUND');
  });

  it('falls back to a generic message when the error body has neither', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(null, false, 500));

    await expect(httpApi.listProducts()).rejects.toThrow('Request failed with status 500');
  });

  it('surfaces a clear error when the response body is not valid JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('invalid json')),
    } as unknown as Response);

    await expect(httpApi.listProducts()).rejects.toThrow('Request failed with status 502');
  });

  it('throws a network error message when fetch rejects', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('connection refused'));

    await expect(httpApi.listProducts()).rejects.toThrow('Network request failed');
  });

  it('throws a timeout error when the request is aborted', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    globalThis.fetch = jest.fn().mockRejectedValue(abortError);

    await expect(httpApi.listProducts()).rejects.toThrow('Request timed out');
  });
});
