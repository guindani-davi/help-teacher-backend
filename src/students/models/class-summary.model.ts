export class ClassSummary {
  public readonly id: string;
  public readonly date: string;
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
    id: string,
    date: string,
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
    this.id = id;
    this.date = date;
    this.schedule = schedule;
    this.teacher = teacher;
    this.topics = topics;
  }
}
