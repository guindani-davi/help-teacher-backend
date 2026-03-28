import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class RegistrationOverlapException extends DomainException {
  public constructor() {
    super(
      'Student already has a registration that overlaps with the given date range',
      DomainExceptionCode.REGISTRATION_OVERLAP,
      'errors.registrationOverlap',
    );
  }
}
