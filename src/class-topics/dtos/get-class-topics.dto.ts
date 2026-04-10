import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class GetClassTopicsParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public classId: string;
}
