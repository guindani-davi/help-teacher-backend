import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class InvalidCredentialsException extends DomainException {
  public constructor() {
    super('Invalid email or password', DomainExceptionCode.INVALID_CREDENTIALS);
  }
}
