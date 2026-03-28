import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { DayOfWeekEnum } from '../enums/day-of-week.enum';

export class UpdateScheduleParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public scheduleId: string;
}

export class UpdateScheduleBodyDTO {
  @IsEnum(DayOfWeekEnum)
  @IsOptional()
  public dayOfWeek?: DayOfWeekEnum;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:mm format',
  })
  @IsOptional()
  @MaxLength(255)
  public startTime?: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be in HH:mm format',
  })
  @IsOptional()
  @MaxLength(255)
  public endTime?: string;
}
