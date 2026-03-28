import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DayOfWeekEnum } from '../enums/day-of-week.enum';

export class CreateScheduleParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}

export class CreateScheduleBodyDTO {
  @IsEnum(DayOfWeekEnum)
  public dayOfWeek: DayOfWeekEnum;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:mm format',
  })
  @MaxLength(255)
  public startTime: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be in HH:mm format',
  })
  @MaxLength(255)
  public endTime: string;
}
