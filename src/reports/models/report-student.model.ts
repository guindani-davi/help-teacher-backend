export class ReportStudent {
  public readonly id: string;
  public readonly name: string;
  public readonly surname: string;

  public constructor(id: string, name: string, surname: string) {
    this.id = id;
    this.name = name;
    this.surname = surname;
  }
}
