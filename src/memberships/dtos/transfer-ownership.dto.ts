import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class TransferOwnershipParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public memberId: string;
}
