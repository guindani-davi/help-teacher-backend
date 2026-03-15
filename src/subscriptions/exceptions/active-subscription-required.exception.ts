import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class ActiveSubscriptionRequiredException extends DomainException {
  public constructor() {
    super(
      'An active subscription is required for this action',
      DomainExceptionCode.ACTIVE_SUBSCRIPTION_REQUIRED,
    );
  }
}
