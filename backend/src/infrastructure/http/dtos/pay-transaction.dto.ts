import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min, MinLength } from 'class-validator';
import { IsLuhnValid } from '../validators/luhn.validator';

export class PayTransactionDto {
  @ApiProperty({
    description:
      'Card number (Luhn-validated). Never persisted nor logged — forwarded in memory to the PSP only.',
    example: '4242424242424242',
  })
  @IsString()
  @IsLuhnValid()
  cardNumber: string;

  @ApiProperty({ description: 'Cardholder name', example: 'JOHN DOE' })
  @IsString()
  @MinLength(1)
  holderName: string;

  @ApiProperty({
    description: 'Expiration month, 01-12',
    example: '12',
    pattern: '^(0[1-9]|1[0-2])$',
  })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'expirationMonth must be between 01 and 12',
  })
  expirationMonth: string;

  @ApiProperty({
    description: 'Expiration year, 4 digits',
    example: '2030',
    pattern: '^\\d{4}$',
  })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'expirationYear must be a 4-digit year' })
  expirationYear: string;

  @ApiProperty({
    description: 'Card verification code, 3-4 digits',
    example: '123',
    pattern: '^\\d{3,4}$',
  })
  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'cvc must be 3 or 4 digits' })
  cvc: string;

  @ApiProperty({
    description: 'Number of installments, 1-36',
    minimum: 1,
    maximum: 36,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(36)
  installments: number;
}
