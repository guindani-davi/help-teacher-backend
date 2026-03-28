import { DomainExceptionCode } from '../enums/domain-exception-code.enum';

export abstract class DomainException extends Error {
  public readonly code: DomainExceptionCode;
  public readonly messageKey: string;
  public readonly messageArgs?: Record<string, string>;
  public readonly details?: string[];

  protected constructor(
    message: string,
    code: DomainExceptionCode,
    messageKey: string,
    messageArgs?: Record<string, string>,
    details?: string[],
  ) {
    super(message);
    this.code = code;
    this.messageKey = messageKey;
    this.messageArgs = messageArgs;
    this.details = details;
    this.name = this.constructor.name;
  }
}
