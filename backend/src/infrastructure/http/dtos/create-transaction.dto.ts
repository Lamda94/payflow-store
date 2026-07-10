import { IsEmail, IsInt, IsUUID, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEmail()
  customerEmail: string;
}
