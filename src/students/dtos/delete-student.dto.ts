import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class DeleteStudentParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public studentId: string;
}
