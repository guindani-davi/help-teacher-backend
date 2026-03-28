import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateClassTopicParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public classId: string;
}

export class CreateClassTopicBodyDTO {
  @IsUUID()
  public topicId: string;
}
