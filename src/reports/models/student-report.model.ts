import { ReportClass } from './report-class.model';
import { ReportOrganization } from './report-organization.model';
import { ReportRegistration } from './report-registration.model';
import { ReportStudent } from './report-student.model';

export class StudentReport {
  public readonly organization: ReportOrganization;
  public readonly student: ReportStudent;
  public readonly registration: ReportRegistration | null;
  public readonly classes: ReportClass[];

  public constructor(
    organization: ReportOrganization,
    student: ReportStudent,
    registration: ReportRegistration | null,
    classes: ReportClass[],
  ) {
    this.organization = organization;
    this.student = student;
    this.registration = registration;
    this.classes = classes;
  }
}
