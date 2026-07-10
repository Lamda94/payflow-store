export interface CardData {
  number: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvc: string;
  installments: number;
}

export enum PaymentResultStatus {
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
}

export interface PaymentResult {
  status: PaymentResultStatus;
  pspTransactionId: string;
  message?: string;
}

export interface PaymentGateway {
  charge(
    cardData: CardData,
    amountInCents: number,
    currency: string,
    reference: string,
    customerEmail: string,
  ): Promise<PaymentResult>;
}

export const PAYMENT_GATEWAY = Symbol('PaymentGateway');
