import { IsNotEmpty, IsUUID } from 'class-validator';

export class SubscribeBodyDTO {
  @IsUUID()
  @IsNotEmpty()
  public planId: string;
}
