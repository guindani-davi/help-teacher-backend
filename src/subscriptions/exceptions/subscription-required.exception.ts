import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class SubscriptionRequiredException extends DomainException {
  public constructor() {
    super(
      'An active subscription is required to perform this action. If you are not the organization owner, please contact them to subscribe.',
      DomainExceptionCode.SUBSCRIPTION_REQUIRED,
      'errors.subscriptionRequired',
    );
  }
}
