import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsDateString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRequestDto {
  @IsString()
  @MinLength(10)
  description: string;

  @IsNumber()
  @Type(() => Number)
  location_lat: number;

  @IsNumber()
  @Type(() => Number)
  location_lng: number;

  @IsOptional()
  @IsString()
  location_name?: string;

  @IsOptional()
  @IsString()
  location_address?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_emergency?: boolean;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}
