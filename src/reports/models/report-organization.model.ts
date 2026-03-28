export class ReportOrganization {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly logoUrl: string | null;

  public constructor(
    id: string,
    name: string,
    slug: string,
    logoUrl: string | null,
  ) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.logoUrl = logoUrl;
  }
}
