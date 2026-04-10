import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class GetScheduleParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public scheduleId: string;
}
