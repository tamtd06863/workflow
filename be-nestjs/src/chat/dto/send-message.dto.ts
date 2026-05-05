import { IsString, IsEnum, IsOptional, IsArray, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsEnum(['customer_operator', 'customer_staff'])
  channel: 'customer_operator' | 'customer_staff';

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media_urls?: string[];
}
