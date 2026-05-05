import { IsString, MinLength } from 'class-validator';

export class MatchCategoriesDto {
  @IsString()
  @MinLength(5)
  description: string;
}
