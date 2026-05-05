import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CompleteJobDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  final_price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  collected_amount?: number;
}
