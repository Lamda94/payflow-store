import { HttpStatus } from '@nestjs/common';
import {
  InsufficientStockError,
  ProductNotFoundError,
  TransactionAlreadyProcessedError,
  TransactionNotFoundError,
} from '../../../domain/errors/domain.errors';
import { DomainExceptionFilter } from './domain-exception.filter';

function makeHost(responseMock: { status: jest.Mock; json: jest.Mock }) {
  return {
    switchToHttp: () => ({
      getResponse: () => responseMock,
    }),
  } as unknown as import('@nestjs/common').ArgumentsHost;
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
  });

  it('maps ProductNotFoundError → 404 PRODUCT_NOT_FOUND', () => {
    filter.catch(
      new ProductNotFoundError('prod-1'),
      makeHost({ status, json }),
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PRODUCT_NOT_FOUND' }),
    );
  });

  it('maps TransactionNotFoundError → 404 TRANSACTION_NOT_FOUND', () => {
    filter.catch(
      new TransactionNotFoundError('txn-1'),
      makeHost({ status, json }),
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TRANSACTION_NOT_FOUND' }),
    );
  });

  it('maps InsufficientStockError → 422 INSUFFICIENT_STOCK', () => {
    filter.catch(new InsufficientStockError(0, 1), makeHost({ status, json }));
    expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INSUFFICIENT_STOCK' }),
    );
  });

  it('maps TransactionAlreadyProcessedError → 409 TRANSACTION_ALREADY_PROCESSED', () => {
    filter.catch(
      new TransactionAlreadyProcessedError('txn-1'),
      makeHost({ status, json }),
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TRANSACTION_ALREADY_PROCESSED' }),
    );
  });

  it('maps network timeout error → 502 PAYMENT_GATEWAY_ERROR', () => {
    filter.catch(new Error('timeout exceeded'), makeHost({ status, json }));
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PAYMENT_GATEWAY_ERROR' }),
    );
  });

  it('maps ECONNREFUSED → 502 PAYMENT_GATEWAY_ERROR', () => {
    filter.catch(
      new Error('connect ECONNREFUSED 127.0.0.1:5432'),
      makeHost({ status, json }),
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
  });

  it('maps unknown error → 500 INTERNAL_ERROR', () => {
    filter.catch(new Error('something unexpected'), makeHost({ status, json }));
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    );
  });

  it('maps non-Error thrown values → 500 INTERNAL_ERROR', () => {
    filter.catch('string error', makeHost({ status, json }));
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
