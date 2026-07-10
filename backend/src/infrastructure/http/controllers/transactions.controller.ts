import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateTransactionUseCase } from '../../../application/use-cases/create-transaction.use-case';
import { GetTransactionStatusUseCase } from '../../../application/use-cases/get-transaction-status.use-case';
import { ProcessPaymentUseCase } from '../../../application/use-cases/process-payment.use-case';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { PayTransactionDto } from '../dtos/pay-transaction.dto';
import {
  CREATE_TRANSACTION_USE_CASE,
  GET_TRANSACTION_STATUS_USE_CASE,
  PROCESS_PAYMENT_USE_CASE,
} from '../tokens/use-case.tokens';

@Controller('transactions')
export class TransactionsController {
  constructor(
    @Inject(CREATE_TRANSACTION_USE_CASE)
    private readonly createTransaction: CreateTransactionUseCase,
    @Inject(PROCESS_PAYMENT_USE_CASE)
    private readonly processPayment: ProcessPaymentUseCase,
    @Inject(GET_TRANSACTION_STATUS_USE_CASE)
    private readonly getTransactionStatus: GetTransactionStatusUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTransactionDto) {
    return this.createTransaction.execute({
      productId: dto.productId,
      quantity: dto.quantity,
      customerEmail: dto.customerEmail,
    });
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  async pay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayTransactionDto,
  ) {
    const result = await this.processPayment.execute({
      transactionId: id,
      cardData: {
        number: dto.cardNumber,
        holderName: dto.holderName,
        expirationMonth: dto.expirationMonth,
        expirationYear: dto.expirationYear,
        cvc: dto.cvc,
        installments: dto.installments,
      },
    });

    return {
      status: result.status,
      transactionId: result.transactionId,
      pspTransactionId: result.pspTransactionId,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const txn = await this.getTransactionStatus.execute(id);
    return {
      id: txn.id,
      status: txn.status,
      amountInCents: txn.amountInCents,
      currency: txn.currency,
      createdAt: txn.createdAt,
    };
  }
}
