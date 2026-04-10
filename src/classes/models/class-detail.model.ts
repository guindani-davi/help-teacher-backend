export class ClassDetail {
  public readonly classInfo: {
    id: string;
    date: string;
  };
  public readonly student: { id: string; name: string; surname: string };
  public readonly schedule: {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  public readonly teacher: { id: string; name: string; surname: string };
  public readonly topics: {
    id: string;
    name: string;
    subject: { id: string; name: string };
  }[];

  public constructor(
    classInfo: { id: string; date: string },
    student: { id: string; name: string; surname: string },
    schedule: {
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    },
    teacher: { id: string; name: string; surname: string },
    topics: {
      id: string;
      name: string;
      subject: { id: string; name: string };
    }[],
  ) {
    this.classInfo = classInfo;
    this.student = student;
    this.schedule = schedule;
    this.teacher = teacher;
    this.topics = topics;
  }
}
