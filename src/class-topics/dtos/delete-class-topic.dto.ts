import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class DeleteClassTopicParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public classId: string;

  @IsUUID()
  public classTopicId: string;
}
