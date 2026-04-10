export class Class {
  public readonly id: string;
  public readonly scheduleId: string;
  public readonly studentId: string;
  public readonly teacherId: string;
  public readonly date: string;
  public readonly organizationId: string;
  public readonly isActive: boolean;
  public readonly createdBy: string;
  public readonly updatedBy: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    scheduleId: string,
    studentId: string,
    teacherId: string,
    date: string,
    organizationId: string,
    isActive: boolean,
    createdBy: string,
    updatedBy: string | null,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.scheduleId = scheduleId;
    this.studentId = studentId;
    this.teacherId = teacherId;
    this.date = date;
    this.organizationId = organizationId;
    this.isActive = isActive;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
