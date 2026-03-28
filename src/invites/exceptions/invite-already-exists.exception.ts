import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class InviteAlreadyExistsException extends DomainException {
  public constructor() {
    super(
      'A pending invite already exists for this email in this organization',
      DomainExceptionCode.INVITE_ALREADY_EXISTS,
      'errors.inviteAlreadyExists',
    );
  }
}
