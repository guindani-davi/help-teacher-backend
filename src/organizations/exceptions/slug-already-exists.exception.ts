import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class SlugAlreadyExistsException extends DomainException {
  public constructor() {
    super(
      'An organization with this name already exists',
      DomainExceptionCode.SLUG_ALREADY_EXISTS,
      'errors.slugAlreadyExists',
    );
  }
}
