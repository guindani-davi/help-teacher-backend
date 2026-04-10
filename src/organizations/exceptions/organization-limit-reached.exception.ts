import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class OrganizationLimitReachedException extends DomainException {
  public constructor() {
    super(
      'Organization limit reached for the current subscription tier',
      DomainExceptionCode.ORGANIZATION_LIMIT_REACHED,
      'errors.organizationLimitReached',
    );
  }
}
