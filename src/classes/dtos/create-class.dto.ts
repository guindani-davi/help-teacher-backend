import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateClassParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}

export class CreateClassBodyDTO {
  @IsUUID()
  public scheduleId: string;

  @IsUUID()
  public studentId: string;

  @IsUUID()
  public teacherId: string;

  @IsDateString()
  @MaxLength(255)
  public date: string;
}
