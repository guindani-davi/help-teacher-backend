import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class UnlinkStudentUserParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public studentId: string;

  @IsUUID()
  public studentUserId: string;
}
