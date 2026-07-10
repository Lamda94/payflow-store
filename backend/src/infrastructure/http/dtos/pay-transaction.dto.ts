import { IsInt, IsString, Matches, Max, Min, MinLength } from 'class-validator';
import { IsLuhnValid } from '../validators/luhn.validator';

export class PayTransactionDto {
  @IsString()
  @IsLuhnValid()
  cardNumber: string;

  @IsString()
  @MinLength(1)
  holderName: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'expirationMonth must be between 01 and 12',
  })
  expirationMonth: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'expirationYear must be a 4-digit year' })
  expirationYear: string;

  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'cvc must be 3 or 4 digits' })
  cvc: string;

  @IsInt()
  @Min(1)
  @Max(36)
  installments: number;
}
