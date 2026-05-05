import { IsNumber, IsString, MinLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RequoteJobDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  requote_price: number;

  @IsString()
  @MinLength(5)
  requote_reason: string;
}
