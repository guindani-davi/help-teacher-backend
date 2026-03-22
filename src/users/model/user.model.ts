export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly name: string;
  public readonly surname: string;
  public readonly hashedPassword: string;
  public readonly asaasCustomerId: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    email: string,
    name: string,
    surname: string,
    hashedPassword: string,
    asaasCustomerId: string | null,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.surname = surname;
    this.hashedPassword = hashedPassword;
    this.asaasCustomerId = asaasCustomerId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
