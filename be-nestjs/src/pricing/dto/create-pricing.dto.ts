import { IsString, IsOptional, IsNumber, IsInt, IsBoolean, MinLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePricingDto {
  @IsString()
  category_id: string;

  @IsString()
  @MinLength(3)
  service_name: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price_min?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price_max?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price_fixed?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  estimated_duration_minutes?: number;
}
