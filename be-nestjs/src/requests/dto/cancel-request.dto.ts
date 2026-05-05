import { IsOptional, IsString } from 'class-validator';

export class CancelRequestDto {
  @IsOptional()
  @IsString()
  cancel_reason?: string;
}
