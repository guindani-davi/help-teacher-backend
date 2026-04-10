import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class UserSubscriptionRequiredException extends DomainException {
  public constructor() {
    super(
      'An active subscription is required to perform this action. Please subscribe to a plan to continue.',
      DomainExceptionCode.SUBSCRIPTION_REQUIRED,
      'errors.userSubscriptionRequired',
    );
  }
}
