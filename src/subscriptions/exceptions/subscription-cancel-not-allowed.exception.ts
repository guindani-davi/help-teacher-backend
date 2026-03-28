import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class SubscriptionCancelNotAllowedException extends DomainException {
  public constructor() {
    super(
      'Cannot cancel subscription in its current state',
      DomainExceptionCode.SUBSCRIPTION_CANCEL_NOT_ALLOWED,
      'errors.subscriptionCancelNotAllowed',
    );
  }
}
