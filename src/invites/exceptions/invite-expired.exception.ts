import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class InviteExpiredException extends DomainException {
  public constructor() {
    super(
      'This invite has expired',
      DomainExceptionCode.INVITE_EXPIRED,
      'errors.inviteExpired',
    );
  }
}
