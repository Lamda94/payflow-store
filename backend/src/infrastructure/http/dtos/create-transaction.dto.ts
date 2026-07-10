import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsUUID, Min } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Product id from GET /products',
    format: 'uuid',
    example: 'a1b2c3d4-0002-4002-8002-000000000002',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Units to buy', minimum: 1, example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Customer email used for the delivery',
    format: 'email',
    example: 'customer@example.com',
  })
  @IsEmail()
  customerEmail: string;
}
