import type { Product } from '../domain/types';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import type {
  CardPaymentInput,
  CreateTransactionInput,
  CreateTransactionResult,
  PayflowApi,
  PayTransactionResult,
  TransactionStatusResult,
} from './api';

interface ErrorBody {
  code?: string;
  message?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw new Error('Network request failed');
  } finally {
    clearTimeout(timeout);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = (body ?? {}) as ErrorBody;
    throw new Error(
      errorBody.message ?? errorBody.code ?? `Request failed with status ${response.status}`,
    );
  }

  return body as T;
}

/** Real HTTP client against the payflow-store backend (see /docs for the OpenAPI spec). */
export const httpApi: PayflowApi = {
  listProducts: () => request<Product[]>('/products'),

  createTransaction: (input: CreateTransactionInput) =>
    request<CreateTransactionResult>('/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  payTransaction: (transactionId: string, card: CardPaymentInput) =>
    request<PayTransactionResult>(`/transactions/${transactionId}/pay`, {
      method: 'POST',
      body: JSON.stringify(card),
    }),

  getTransactionStatus: (transactionId: string) =>
    request<TransactionStatusResult>(`/transactions/${transactionId}`),
};
