import type { Product, TransactionStatus } from '../domain/types';

export interface CreateTransactionInput {
  productId: string;
  quantity: number;
  customerEmail: string;
}

export interface CreateTransactionResult {
  transactionId: string;
  reference: string;
  amountInCents: number;
  currency: string;
}

export interface CardPaymentInput {
  cardNumber: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvc: string;
  installments: number;
}

export interface PayTransactionResult {
  status: TransactionStatus;
  transactionId: string;
  pspTransactionId?: string;
}

export interface TransactionStatusResult {
  id: string;
  status: TransactionStatus;
  amountInCents: number;
  currency: string;
  createdAt: string;
}

/**
 * Backend contract (payflow-store API). Implemented with a real HTTP
 * client in M5 — thunks depend on this interface via the store's thunk
 * extra argument so they stay testable with a mock before then.
 */
export interface PayflowApi {
  listProducts(): Promise<Product[]>;
  createTransaction(
    input: CreateTransactionInput,
  ): Promise<CreateTransactionResult>;
  payTransaction(
    transactionId: string,
    card: CardPaymentInput,
  ): Promise<PayTransactionResult>;
  getTransactionStatus(
    transactionId: string,
  ): Promise<TransactionStatusResult>;
}

export const notImplementedApi: PayflowApi = {
  listProducts() {
    return Promise.reject(new Error('PayflowApi.listProducts: not implemented until M5'));
  },
  createTransaction() {
    return Promise.reject(
      new Error('PayflowApi.createTransaction: not implemented until M5'),
    );
  },
  payTransaction() {
    return Promise.reject(new Error('PayflowApi.payTransaction: not implemented until M5'));
  },
  getTransactionStatus() {
    return Promise.reject(
      new Error('PayflowApi.getTransactionStatus: not implemented until M5'),
    );
  },
};
