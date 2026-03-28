import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class GetStudentReportParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public studentId: string;
}
