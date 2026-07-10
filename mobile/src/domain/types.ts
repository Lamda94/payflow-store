export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceInCents: number;
  currency: string;
  stock: number;
}

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export interface TransactionRecord {
  id: string;
  reference: string;
  status: TransactionStatus;
  amountInCents: number;
  currency: string;
  createdAt: string;
}
