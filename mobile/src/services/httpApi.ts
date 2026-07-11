import type { Product } from '../domain/types';
import { API_BASE_URL, PAY_REQUEST_TIMEOUT_MS, REQUEST_TIMEOUT_MS } from './config';
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

/**
 * Carries the backend's machine-readable error `code` (e.g.
 * TRANSACTION_ALREADY_PROCESSED). createAsyncThunk's SerializedError copies
 * `code` through, so thunk consumers can branch on it without importing this.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
    throw new ApiError(
      errorBody.message ?? errorBody.code ?? `Request failed with status ${response.status}`,
      errorBody.code,
      response.status,
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
    request<PayTransactionResult>(
      `/transactions/${transactionId}/pay`,
      {
        method: 'POST',
        body: JSON.stringify(card),
      },
      PAY_REQUEST_TIMEOUT_MS,
    ),

  getTransactionStatus: (transactionId: string) =>
    request<TransactionStatusResult>(`/transactions/${transactionId}`),
};
