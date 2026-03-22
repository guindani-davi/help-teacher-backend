import { IsNotEmpty, IsUUID } from 'class-validator';

export class ChangePlanBodyDTO {
  @IsUUID()
  @IsNotEmpty()
  public planId: string;
}
