import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class GetSchoolParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public schoolId: string;
}
