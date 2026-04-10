export class Registration {
  public readonly id: string;
  public readonly studentId: string;
  public readonly schoolId: string;
  public readonly gradeLevelId: string;
  public readonly organizationId: string;
  public readonly startDate: string;
  public readonly endDate: string | null;
  public readonly isActive: boolean;
  public readonly createdBy: string;
  public readonly updatedBy: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    studentId: string,
    schoolId: string,
    gradeLevelId: string,
    organizationId: string,
    startDate: string,
    endDate: string | null,
    isActive: boolean,
    createdBy: string,
    updatedBy: string | null,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.studentId = studentId;
    this.schoolId = schoolId;
    this.gradeLevelId = gradeLevelId;
    this.organizationId = organizationId;
    this.startDate = startDate;
    this.endDate = endDate;
    this.isActive = isActive;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
