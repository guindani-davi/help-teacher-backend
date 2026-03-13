import { DomainException } from '../../common/exceptions/domain.exception';

export class SlugAlreadyExistsException extends DomainException {
  public constructor() {
    super(
      'An organization with this name already exists',
      'SLUG_ALREADY_EXISTS',
    );
  }
}
