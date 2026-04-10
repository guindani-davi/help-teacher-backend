import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class LinkStudentUserParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public studentId: string;
}

export class LinkStudentUserBodyDTO {
  @IsUUID()
  public userId: string;
}
