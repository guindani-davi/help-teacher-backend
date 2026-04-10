import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class DeleteSchoolParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public schoolId: string;
}
