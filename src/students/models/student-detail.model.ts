import { ClassSummary } from './class-summary.model';
import { RegistrationDetail } from './registration-detail.model';

export class StudentDetail {
  public readonly student: {
    id: string;
    name: string;
    surname: string;
  };
  public readonly currentRegistration: RegistrationDetail | null;
  public readonly registrations: RegistrationDetail[];
  public readonly classes: ClassSummary[];
  public readonly totalClasses: number;

  public constructor(
    student: { id: string; name: string; surname: string },
    currentRegistration: RegistrationDetail | null,
    registrations: RegistrationDetail[],
    classes: ClassSummary[],
    totalClasses: number,
  ) {
    this.student = student;
    this.currentRegistration = currentRegistration;
    this.registrations = registrations;
    this.classes = classes;
    this.totalClasses = totalClasses;
  }
}
