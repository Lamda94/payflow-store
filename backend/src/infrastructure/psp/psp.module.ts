import { Module } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../domain/ports/payment-gateway.port';
import { PspClient } from './psp.client';
import { PspPaymentGateway } from './psp-payment.gateway';

@Module({
  providers: [
    {
      provide: PAYMENT_GATEWAY,
      useFactory: () => {
        const client = new PspClient(
          process.env.PSP_API_URL ?? '',
          process.env.PSP_PUBLIC_KEY ?? '',
          process.env.PSP_PRIVATE_KEY ?? '',
        );
        return new PspPaymentGateway(client, process.env.PSP_INTEGRITY_KEY ?? '');
      },
    },
  ],
  exports: [PAYMENT_GATEWAY],
})
export class PspModule {}
