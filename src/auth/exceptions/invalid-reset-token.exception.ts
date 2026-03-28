import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class InvalidResetTokenException extends DomainException {
  public constructor() {
    super(
      'Invalid or expired reset token',
      DomainExceptionCode.INVALID_RESET_TOKEN,
      'errors.invalidResetToken',
    );
  }
}
