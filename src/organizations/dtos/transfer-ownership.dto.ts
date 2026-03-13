import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class TransferOwnershipParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;

  @IsUUID()
  public memberId: string;
}
