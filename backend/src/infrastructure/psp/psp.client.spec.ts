import axios from 'axios';
import { PspClient } from './psp.client';

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));

const getMockedHttp = () => (axios.create as jest.Mock).mock.results[0].value as { get: jest.Mock; post: jest.Mock };

describe('PspClient', () => {
  let client: PspClient;
  let http: { get: jest.Mock; post: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new PspClient('https://api.sandbox.test/v1', 'pub_key', 'prv_key');
    http = getMockedHttp();
  });

  describe('getMerchantAcceptanceToken()', () => {
    it('returns acceptance token from merchant endpoint', async () => {
      http.get.mockResolvedValue({
        data: { data: { presigned_acceptance: { acceptance_token: 'tok-abc' } } },
      });

      const token = await client.getMerchantAcceptanceToken();
      expect(token).toBe('tok-abc');
      expect(http.get).toHaveBeenCalledWith('/merchants/pub_key');
    });
  });

  describe('tokenizeCard()', () => {
    it('returns card token', async () => {
      http.post.mockResolvedValue({ data: { data: { id: 'card-tok-123' } } });

      const token = await client.tokenizeCard({
        number: '4111111111111111',
        cvc: '123',
        expMonth: '12',
        expYear: '2030',
        cardHolder: 'Test User',
      });

      expect(token).toBe('card-tok-123');
      expect(http.post).toHaveBeenCalledWith(
        '/tokens/cards',
        expect.objectContaining({ number: '4111111111111111' }),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer pub_key' }) }),
      );
    });
  });

  describe('createTransaction()', () => {
    it('returns psp transaction id', async () => {
      http.post.mockResolvedValue({ data: { data: { id: 'psp-txn-001', status: 'PENDING', status_message: null } } });

      const id = await client.createTransaction({
        amount_in_cents: 199000,
        currency: 'COP',
        customer_email: 'user@test.com',
        reference: 'ref-001',
        acceptance_token: 'tok-abc',
        signature: 'sig-xyz',
        payment_method: { type: 'CARD', token: 'card-tok-123', installments: 1 },
      });

      expect(id).toBe('psp-txn-001');
      expect(http.post).toHaveBeenCalledWith(
        '/transactions',
        expect.objectContaining({ reference: 'ref-001' }),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer prv_key' }) }),
      );
    });
  });

  describe('getTransactionStatus()', () => {
    it('returns transaction status data', async () => {
      http.get.mockResolvedValue({
        data: { data: { id: 'psp-txn-001', status: 'APPROVED', status_message: null } },
      });

      const data = await client.getTransactionStatus('psp-txn-001');
      expect(data.status).toBe('APPROVED');
      expect(http.get).toHaveBeenCalledWith(
        '/transactions/psp-txn-001',
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer prv_key' }) }),
      );
    });
  });
});
