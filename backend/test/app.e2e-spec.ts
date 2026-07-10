import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { DomainExceptionFilter } from './../src/infrastructure/http/filters/domain-exception.filter';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
  PaymentResultStatus,
} from './../src/domain/ports/payment-gateway.port';

const chargeMock = jest.fn();
const gatewayMock: PaymentGateway = { charge: chargeMock };

const VALID_CARD = {
  cardNumber: '4111111111111111',
  holderName: 'Test User',
  expirationMonth: '12',
  expirationYear: '2030',
  cvc: '123',
  installments: 1,
};

interface ProductResponse {
  id: string;
  name: string;
  priceInCents: number;
  stock: number;
}

describe('PayFlow API (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  const getProducts = async (): Promise<ProductResponse[]> => {
    const res = await request(http).get('/products').expect(200);
    return res.body as ProductResponse[];
  };

  const createTransaction = async (
    productId: string,
    quantity = 1,
  ): Promise<string> => {
    const res = await request(http)
      .post('/transactions')
      .send({ productId, quantity, customerEmail: 'e2e@test.com' })
      .expect(201);
    const body = res.body as { transactionId: string };
    expect(body.transactionId).toBeDefined();
    return body.transactionId;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PAYMENT_GATEWAY)
      .useValue(gatewayMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await app.get(DataSource).runMigrations();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    chargeMock.mockReset();
  });

  it('GET /health responds ok', async () => {
    const res = await request(http).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /products returns the seeded catalog with integer prices and stock', async () => {
    const products = await getProducts();
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(Number.isInteger(p.priceInCents)).toBe(true);
      expect(Number.isInteger(p.stock)).toBe(true);
      expect(p.stock).toBeGreaterThan(0);
    }
  });

  it('full flow — APPROVED payment decreases stock', async () => {
    const [product] = await getProducts();
    const txnId = await createTransaction(product.id);

    chargeMock.mockResolvedValue({
      status: PaymentResultStatus.APPROVED,
      pspTransactionId: 'psp-e2e-approved',
    });

    const payRes = await request(http)
      .post(`/transactions/${txnId}/pay`)
      .send(VALID_CARD)
      .expect(200);
    expect(payRes.body).toMatchObject({
      status: 'APPROVED',
      transactionId: txnId,
      pspTransactionId: 'psp-e2e-approved',
    });

    const statusRes = await request(http)
      .get(`/transactions/${txnId}`)
      .expect(200);
    expect((statusRes.body as { status: string }).status).toBe('APPROVED');

    const after = await getProducts();
    const updated = after.find((p) => p.id === product.id);
    expect(updated?.stock ?? 0).toBe(product.stock - 1);
  });

  it('full flow — DECLINED payment does not touch stock and is final', async () => {
    const [product] = await getProducts();
    const stockBefore = product.stock;
    const txnId = await createTransaction(product.id);

    chargeMock.mockResolvedValue({
      status: PaymentResultStatus.DECLINED,
      pspTransactionId: 'psp-e2e-declined',
    });

    const payRes = await request(http)
      .post(`/transactions/${txnId}/pay`)
      .send(VALID_CARD)
      .expect(200);
    expect((payRes.body as { status: string }).status).toBe('DECLINED');

    const after = await getProducts();
    const same = after.find((p) => p.id === product.id);
    expect(same?.stock).toBe(stockBefore);

    const retry = await request(http)
      .post(`/transactions/${txnId}/pay`)
      .send(VALID_CARD)
      .expect(409);
    expect((retry.body as { code: string }).code).toBe(
      'TRANSACTION_ALREADY_PROCESSED',
    );
    expect(chargeMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a card that fails Luhn validation with 400 without touching the PSP', async () => {
    const [product] = await getProducts();
    const txnId = await createTransaction(product.id);

    await request(http)
      .post(`/transactions/${txnId}/pay`)
      .send({ ...VALID_CARD, cardNumber: '4111111111111112' })
      .expect(400);
    expect(chargeMock).not.toHaveBeenCalled();
  });

  it('returns 404 PRODUCT_NOT_FOUND for an unknown product', async () => {
    const res = await request(http)
      .post('/transactions')
      .send({
        productId: '00000000-0000-4000-8000-000000000000',
        quantity: 1,
        customerEmail: 'e2e@test.com',
      })
      .expect(404);
    expect((res.body as { code: string }).code).toBe('PRODUCT_NOT_FOUND');
  });

  it('returns 404 TRANSACTION_NOT_FOUND when paying an unknown transaction', async () => {
    const res = await request(http)
      .post('/transactions/00000000-0000-4000-8000-000000000000/pay')
      .send(VALID_CARD)
      .expect(404);
    expect((res.body as { code: string }).code).toBe('TRANSACTION_NOT_FOUND');
  });

  it('returns 422 INSUFFICIENT_STOCK when quantity exceeds stock', async () => {
    const [product] = await getProducts();
    const res = await request(http)
      .post('/transactions')
      .send({
        productId: product.id,
        quantity: product.stock + 1,
        customerEmail: 'e2e@test.com',
      })
      .expect(422);
    expect((res.body as { code: string }).code).toBe('INSUFFICIENT_STOCK');
  });
});
