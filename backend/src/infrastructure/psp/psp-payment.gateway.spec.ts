import { PspPaymentGateway } from './psp-payment.gateway';
import { PspClient } from './psp.client';
import { PaymentResultStatus } from '../../domain/ports/payment-gateway.port';
import { buildIntegritySignature } from './psp-signature.helper';

const INTEGRITY_KEY = 'test_integrity_key';

const makeCardData = () => ({
  number: '4111111111111111',
  holderName: 'Test User',
  expirationMonth: '12',
  expirationYear: '2030',
  cvc: '123',
  installments: 1,
});

const makeClient = (
  overrides: Partial<Record<keyof PspClient, jest.Mock>> = {},
): PspClient =>
  ({
    getMerchantAcceptanceToken: jest
      .fn()
      .mockResolvedValue('acceptance-token-123'),
    tokenizeCard: jest.fn().mockResolvedValue('card-token-abc'),
    createTransaction: jest.fn().mockResolvedValue('psp-txn-001'),
    getTransactionStatus: jest.fn().mockResolvedValue({
      id: 'psp-txn-001',
      status: 'APPROVED',
      status_message: null,
    }),
    ...overrides,
  }) as unknown as PspClient;

describe('PspPaymentGateway', () => {
  describe('charge() — happy path APPROVED', () => {
    it('returns APPROVED result with pspTransactionId', async () => {
      const gateway = new PspPaymentGateway(makeClient(), INTEGRITY_KEY);
      const result = await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(result.status).toBe(PaymentResultStatus.APPROVED);
      expect(result.pspTransactionId).toBe('psp-txn-001');
    });

    it('sends correct integrity signature to createTransaction', async () => {
      const client = makeClient();
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY);
      await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      const expectedSig = buildIntegritySignature(
        'ref-001',
        199000,
        'COP',
        INTEGRITY_KEY,
      );
      expect(client.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ signature: expectedSig }),
      );
    });

    it('tokenizes the card with a 2-digit expiration year (PSP format)', async () => {
      const client = makeClient();
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY);
      await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(client.tokenizeCard).toHaveBeenCalledWith(
        expect.objectContaining({ expYear: '30' }),
      );
    });

    it('passes card token and acceptance token to createTransaction', async () => {
      const client = makeClient();
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY);
      await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(client.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          acceptance_token: 'acceptance-token-123',
          payment_method: expect.objectContaining({ token: 'card-token-abc' }),
        }),
      );
    });
  });

  describe('charge() — DECLINED', () => {
    it('returns DECLINED when PSP declines the card', async () => {
      const client = makeClient({
        getTransactionStatus: jest.fn().mockResolvedValue({
          id: 'psp-txn-001',
          status: 'DECLINED',
          status_message: 'Card declined',
        }),
      });
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY);
      const result = await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(result.status).toBe(PaymentResultStatus.DECLINED);
      expect(result.message).toBe('Card declined');
    });
  });

  describe('charge() — ERROR', () => {
    it('returns ERROR when PSP returns ERROR status', async () => {
      const client = makeClient({
        getTransactionStatus: jest.fn().mockResolvedValue({
          id: 'psp-txn-001',
          status: 'ERROR',
          status_message: 'Internal error',
        }),
      });
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY);
      const result = await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(result.status).toBe(PaymentResultStatus.ERROR);
    });

    it('returns ERROR (without pspTransactionId) when tokenization fails', async () => {
      const client = makeClient({
        tokenizeCard: jest
          .fn()
          .mockRejectedValue(new Error('Request failed with status code 422')),
      });
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY);

      const result = await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(result.status).toBe(PaymentResultStatus.ERROR);
      expect(result.pspTransactionId).toBeUndefined();
      expect(result.message).toContain('422');
    });

    it('returns ERROR when the PSP is unreachable', async () => {
      const client = makeClient({
        getMerchantAcceptanceToken: jest
          .fn()
          .mockRejectedValue(new Error('Network error')),
      });
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY);

      const result = await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(result.status).toBe(PaymentResultStatus.ERROR);
      expect(result.message).toBe('Network error');
    });

    it('returns ERROR with pspTransactionId when polling fails after creation', async () => {
      const client = makeClient({
        getTransactionStatus: jest
          .fn()
          .mockRejectedValue(new Error('Network error')),
      });
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY);

      const result = await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(result.status).toBe(PaymentResultStatus.ERROR);
      expect(result.pspTransactionId).toBe('psp-txn-001');
    });
  });

  describe('charge() — polling', () => {
    it('polls until terminal status is reached', async () => {
      const getTransactionStatus = jest
        .fn()
        .mockResolvedValueOnce({
          id: 'psp-txn-001',
          status: 'PENDING',
          status_message: null,
        })
        .mockResolvedValueOnce({
          id: 'psp-txn-001',
          status: 'PENDING',
          status_message: null,
        })
        .mockResolvedValueOnce({
          id: 'psp-txn-001',
          status: 'APPROVED',
          status_message: null,
        });

      const client = makeClient({ getTransactionStatus });
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY, 30000);

      const result = await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(result.status).toBe(PaymentResultStatus.APPROVED);
      expect(getTransactionStatus).toHaveBeenCalledTimes(3);
    });

    it('returns ERROR when polling times out', async () => {
      const getTransactionStatus = jest.fn().mockResolvedValue({
        id: 'psp-txn-001',
        status: 'PENDING',
        status_message: null,
      });

      const client = makeClient({ getTransactionStatus });
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY, 1);

      const result = await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );

      expect(result.status).toBe(PaymentResultStatus.ERROR);
      expect(result.message).toContain('timed out');
    });

    it('maps VOIDED status to DECLINED', async () => {
      const client = makeClient({
        getTransactionStatus: jest.fn().mockResolvedValue({
          id: 'psp-txn-001',
          status: 'VOIDED',
          status_message: null,
        }),
      });
      const gateway = new PspPaymentGateway(client, INTEGRITY_KEY);
      const result = await gateway.charge(
        makeCardData(),
        199000,
        'COP',
        'ref-001',
        'user@test.com',
      );
      expect(result.status).toBe(PaymentResultStatus.DECLINED);
    });
  });
});
