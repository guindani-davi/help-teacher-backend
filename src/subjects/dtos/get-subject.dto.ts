import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class GetSubjectParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public subjectId: string;
}
