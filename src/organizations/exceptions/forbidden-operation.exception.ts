import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class ForbiddenOperationException extends DomainException {
  public constructor(message: string) {
    super(message, DomainExceptionCode.FORBIDDEN_OPERATION);
  }
}
