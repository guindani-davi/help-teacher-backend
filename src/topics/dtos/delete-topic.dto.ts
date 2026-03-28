import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class DeleteTopicParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public topicId: string;
}
