import { DomainException } from '../../common/exceptions/domain.exception';

export class InvalidCredentialsException extends DomainException {
  public constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS');
  }
}
