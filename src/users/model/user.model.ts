export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly name: string;
  public readonly surname: string;
  public readonly hashedPassword: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    email: string,
    name: string,
    surname: string,
    hashedPassword: string,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.surname = surname;
    this.hashedPassword = hashedPassword;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
