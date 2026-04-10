export class ReportRegistration {
  public readonly id: string;
  public readonly schoolName: string;
  public readonly gradeLevelName: string;
  public readonly educationLevelName: string;
  public readonly startDate: string;
  public readonly endDate: string | null;

  public constructor(
    id: string,
    schoolName: string,
    gradeLevelName: string,
    educationLevelName: string,
    startDate: string,
    endDate: string | null,
  ) {
    this.id = id;
    this.schoolName = schoolName;
    this.gradeLevelName = gradeLevelName;
    this.educationLevelName = educationLevelName;
    this.startDate = startDate;
    this.endDate = endDate;
  }
}
