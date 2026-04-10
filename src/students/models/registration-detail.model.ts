export class RegistrationDetail {
  public readonly id: string;
  public readonly startDate: string;
  public readonly endDate: string | null;
  public readonly school: { id: string; name: string };
  public readonly gradeLevel: {
    id: string;
    name: string;
    educationLevel: { id: string; name: string };
  };

  public constructor(
    id: string,
    startDate: string,
    endDate: string | null,
    school: { id: string; name: string },
    gradeLevel: {
      id: string;
      name: string;
      educationLevel: { id: string; name: string };
    },
  ) {
    this.id = id;
    this.startDate = startDate;
    this.endDate = endDate;
    this.school = school;
    this.gradeLevel = gradeLevel;
  }
}
