export class StudentUser {
  public readonly id: string;
  public readonly studentId: string;
  public readonly userId: string;
  public readonly isActive: boolean;
  public readonly createdBy: string;
  public readonly updatedBy: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    studentId: string,
    userId: string,
    isActive: boolean,
    createdBy: string,
    updatedBy: string | null,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.studentId = studentId;
    this.userId = userId;
    this.isActive = isActive;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
