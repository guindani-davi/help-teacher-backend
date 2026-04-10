import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class SubscriptionNotCancelingException extends DomainException {
  public constructor() {
    super(
      'Subscription is not pending cancellation',
      DomainExceptionCode.SUBSCRIPTION_NOT_CANCELING,
      'errors.subscriptionNotCanceling',
    );
  }
}
