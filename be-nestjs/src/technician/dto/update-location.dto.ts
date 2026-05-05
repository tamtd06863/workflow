import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLocationDto {
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  lng: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  accuracy_m?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  heading?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  speed_mps?: number;

  @IsOptional()
  @IsString()
  request_id?: string;
}
