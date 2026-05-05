import { IsUUID } from 'class-validator';

export class AssignRequestDto {
  @IsUUID()
  staff_id: string;
}
