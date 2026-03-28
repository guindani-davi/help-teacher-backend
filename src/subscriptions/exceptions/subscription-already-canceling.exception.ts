import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class SubscriptionAlreadyCancelingException extends DomainException {
  public constructor() {
    super(
      'Subscription is already scheduled for cancellation at the end of the current period',
      DomainExceptionCode.SUBSCRIPTION_ALREADY_CANCELING,
      'errors.subscriptionAlreadyCanceling',
    );
  }
}
