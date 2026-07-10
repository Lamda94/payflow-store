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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateTransactionUseCase } from '../../../application/use-cases/create-transaction.use-case';
import { GetTransactionStatusUseCase } from '../../../application/use-cases/get-transaction-status.use-case';
import { ProcessPaymentUseCase } from '../../../application/use-cases/process-payment.use-case';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { PayTransactionDto } from '../dtos/pay-transaction.dto';
import {
  CreateTransactionResponseDto,
  ErrorResponseDto,
  PayTransactionResponseDto,
  TransactionStatusResponseDto,
} from '../dtos/api-responses.dto';
import {
  CREATE_TRANSACTION_USE_CASE,
  GET_TRANSACTION_STATUS_USE_CASE,
  PROCESS_PAYMENT_USE_CASE,
} from '../tokens/use-case.tokens';

@ApiTags('transactions')
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
  @ApiOperation({
    summary: 'Create a PENDING transaction for a product',
    description:
      'Validates product and stock availability, then creates the internal transaction with a unique payment reference. Returns the id to use in POST /transactions/{id}/pay.',
  })
  @ApiCreatedResponse({ type: CreateTransactionResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Product not found',
  })
  @ApiUnprocessableEntityResponse({
    type: ErrorResponseDto,
    description: 'Insufficient stock',
  })
  async create(@Body() dto: CreateTransactionDto) {
    return this.createTransaction.execute({
      productId: dto.productId,
      quantity: dto.quantity,
      customerEmail: dto.customerEmail,
    });
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Charge the card via the PSP and settle the transaction',
    description:
      'Tokenizes the card at the PSP, creates the charge and polls until a terminal status. On APPROVED the stock decrement and delivery assignment happen atomically. On DECLINED/ERROR the stock is untouched. Card data is never persisted nor logged.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PayTransactionResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Transaction not found',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Transaction already processed (idempotency)',
  })
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
  @ApiOperation({
    summary: 'Get current transaction status (for polling from the app)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionStatusResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Transaction not found',
  })
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
