import { DomainExceptionCode } from '../enums/domain-exception-code.enum';

export abstract class DomainException extends Error {
  public readonly code: DomainExceptionCode;

  protected constructor(message: string, code: DomainExceptionCode) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
  }
}
