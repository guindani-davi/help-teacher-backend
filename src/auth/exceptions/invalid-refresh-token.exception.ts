import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class InvalidRefreshTokenException extends DomainException {
  public constructor() {
    super(
      'Invalid or expired refresh token',
      DomainExceptionCode.INVALID_REFRESH_TOKEN,
    );
  }
}
