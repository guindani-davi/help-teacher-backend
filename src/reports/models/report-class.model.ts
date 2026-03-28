import { ReportClassTopic } from './report-class-topic.model';

export class ReportClass {
  public readonly id: string;
  public readonly teacherName: string;
  public readonly dayOfWeek: string;
  public readonly startTime: string;
  public readonly endTime: string;
  public readonly date: string;
  public readonly topics: ReportClassTopic[];

  public constructor(
    id: string,
    teacherName: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    date: string,
    topics: ReportClassTopic[],
  ) {
    this.id = id;
    this.teacherName = teacherName;
    this.dayOfWeek = dayOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.date = date;
    this.topics = topics;
  }
}
