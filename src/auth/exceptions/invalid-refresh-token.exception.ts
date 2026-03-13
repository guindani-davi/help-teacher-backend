import { DomainException } from '../../common/exceptions/domain.exception';

export class InvalidRefreshTokenException extends DomainException {
  public constructor() {
    super('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }
}
