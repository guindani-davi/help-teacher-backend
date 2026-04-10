import { DayOfWeekEnum } from '../enums/day-of-week.enum';

export class Schedule {
  public readonly id: string;
  public readonly dayOfWeek: DayOfWeekEnum;
  public readonly startTime: string;
  public readonly endTime: string;
  public readonly organizationId: string;
  public readonly isActive: boolean;
  public readonly createdBy: string;
  public readonly updatedBy: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    dayOfWeek: DayOfWeekEnum,
    startTime: string,
    endTime: string,
    organizationId: string,
    isActive: boolean,
    createdBy: string,
    updatedBy: string | null,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.dayOfWeek = dayOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.organizationId = organizationId;
    this.isActive = isActive;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
