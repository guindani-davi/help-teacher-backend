export class ReportClassTopic {
  public readonly id: string;
  public readonly name: string;
  public readonly subjectName: string;

  public constructor(id: string, name: string, subjectName: string) {
    this.id = id;
    this.name = name;
    this.subjectName = subjectName;
  }
}
