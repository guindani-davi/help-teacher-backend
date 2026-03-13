import { DomainException } from '../../common/exceptions/domain.exception';

export class ForbiddenOperationException extends DomainException {
  public constructor(message: string) {
    super(message, 'FORBIDDEN_OPERATION');
  }
}
