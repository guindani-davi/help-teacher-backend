export class Organization {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly isActive: boolean;
  public readonly createdBy: string;
  public readonly updatedBy: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    name: string,
    slug: string,
    isActive: boolean,
    createdBy: string,
    updatedBy: string | null,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.isActive = isActive;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
