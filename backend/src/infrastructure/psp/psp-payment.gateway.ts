import { Logger } from '@nestjs/common';
import {
  CardData,
  PaymentGateway,
  PaymentResult,
  PaymentResultStatus,
} from '../../domain/ports/payment-gateway.port';
import { PspClient } from './psp.client';
import { buildIntegritySignature } from './psp-signature.helper';

const TERMINAL_STATUSES = new Set(['APPROVED', 'DECLINED', 'ERROR', 'VOIDED']);
const POLL_INTERVAL_MS = 2000;

export class PspPaymentGateway implements PaymentGateway {
  private readonly logger = new Logger(PspPaymentGateway.name);

  constructor(
    private readonly client: PspClient,
    private readonly integrityKey: string,
    private readonly pollTimeoutMs: number = 30000,
  ) {}

  async charge(
    cardData: CardData,
    amountInCents: number,
    currency: string,
    reference: string,
    customerEmail: string,
  ): Promise<PaymentResult> {
    let pspTransactionId: string | undefined;

    try {
      const [acceptanceToken, cardToken] = await Promise.all([
        this.client.getMerchantAcceptanceToken(),
        this.client.tokenizeCard({
          number: cardData.number,
          cvc: cardData.cvc,
          expMonth: cardData.expirationMonth,
          // el PSP exige año de 2 dígitos; el API acepta 4
          expYear: cardData.expirationYear.slice(-2),
          cardHolder: cardData.holderName,
        }),
      ]);

      const signature = buildIntegritySignature(
        reference,
        amountInCents,
        currency,
        this.integrityKey,
      );

      pspTransactionId = await this.client.createTransaction({
        amount_in_cents: amountInCents,
        currency,
        customer_email: customerEmail,
        reference,
        acceptance_token: acceptanceToken,
        signature,
        payment_method: {
          type: 'CARD',
          token: cardToken,
          installments: cardData.installments,
        },
      });

      return await this.pollForResult(pspTransactionId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'PSP communication error';
      this.logger.warn(
        `PSP charge failed for reference ${reference}: ${message}`,
      );
      return {
        status: PaymentResultStatus.ERROR,
        pspTransactionId,
        message,
      };
    }
  }

  private async pollForResult(
    pspTransactionId: string,
  ): Promise<PaymentResult> {
    const deadline = Date.now() + this.pollTimeoutMs;

    while (Date.now() < deadline) {
      const txn = await this.client.getTransactionStatus(pspTransactionId);

      if (TERMINAL_STATUSES.has(txn.status)) {
        return this.mapStatus(txn.status, pspTransactionId, txn.status_message);
      }

      await this.sleep(POLL_INTERVAL_MS);
    }

    return {
      status: PaymentResultStatus.ERROR,
      pspTransactionId,
      message: 'Payment polling timed out',
    };
  }

  private mapStatus(
    pspStatus: string,
    pspTransactionId: string,
    message: string | null,
  ): PaymentResult {
    if (pspStatus === 'APPROVED') {
      return {
        status: PaymentResultStatus.APPROVED,
        pspTransactionId,
        message: message ?? undefined,
      };
    }

    if (pspStatus === 'DECLINED' || pspStatus === 'VOIDED') {
      return {
        status: PaymentResultStatus.DECLINED,
        pspTransactionId,
        message: message ?? undefined,
      };
    }

    return {
      status: PaymentResultStatus.ERROR,
      pspTransactionId,
      message: message ?? undefined,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
