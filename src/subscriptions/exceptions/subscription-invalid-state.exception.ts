import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class SubscriptionInvalidStateException extends DomainException {
  public constructor() {
    super(
      'Subscription is in an unexpected state. Please contact support.',
      DomainExceptionCode.SUBSCRIPTION_INVALID_STATE,
      'errors.subscriptionInvalidState',
    );
  }
}
