import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmPriceDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  agreed_price: number;
}
