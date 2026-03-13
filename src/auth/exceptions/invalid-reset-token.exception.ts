import { DomainException } from '../../common/exceptions/domain.exception';

export class InvalidResetTokenException extends DomainException {
  public constructor() {
    super('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
  }
}
