import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class DeleteGradeLevelParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public educationLevelId: string;

  @IsUUID()
  public gradeLevelId: string;
}
