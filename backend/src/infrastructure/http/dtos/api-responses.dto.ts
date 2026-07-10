import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Mechanical Keyboard TKL' })
  name: string;

  @ApiProperty({ example: 'Tenkeyless mechanical keyboard.' })
  description: string;

  @ApiProperty({ example: 'https://images.example.com/keyboard.jpg' })
  imageUrl: string;

  @ApiProperty({
    description: 'Price in cents (integer — never floats)',
    example: 28900000,
  })
  priceInCents: number;

  @ApiProperty({ example: 'COP' })
  currency: string;

  @ApiProperty({ description: 'Units available', example: 8 })
  stock: number;
}

export class CreateTransactionResponseDto {
  @ApiProperty({ format: 'uuid' })
  transactionId: string;

  @ApiProperty({
    description: 'Unique payment reference sent to the PSP',
    format: 'uuid',
  })
  reference: string;

  @ApiProperty({ example: 28900000 })
  amountInCents: number;

  @ApiProperty({ example: 'COP' })
  currency: string;
}

export class PayTransactionResponseDto {
  @ApiProperty({
    description: 'Final transaction status after the PSP charge',
    enum: ['APPROVED', 'DECLINED', 'ERROR'],
    example: 'APPROVED',
  })
  status: string;

  @ApiProperty({ format: 'uuid' })
  transactionId: string;

  @ApiPropertyOptional({
    description:
      'Transaction id at the PSP. Absent when the failure happened before the PSP transaction was created.',
    example: '15113-1783690470-57513',
  })
  pspTransactionId?: string;
}

export class TransactionStatusResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    enum: ['PENDING', 'APPROVED', 'DECLINED', 'ERROR'],
    example: 'APPROVED',
  })
  status: string;

  @ApiProperty({ example: 28900000 })
  amountInCents: number;

  @ApiProperty({ example: 'COP' })
  currency: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Machine-readable error code',
    example: 'INSUFFICIENT_STOCK',
  })
  code: string;

  @ApiProperty({ example: 'Insufficient stock: requested 9, available 7' })
  message: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;
}
