import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateGradeLevelParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public educationLevelId: string;
}

export class CreateGradeLevelBodyDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public name: string;
}
